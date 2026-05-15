import { Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { Inject } from '@nestjs/common';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { checkInRecords } from '../../database/schema';
import type {
  CheckInRecord,
  CreateCheckInRequest,
  CreateCheckInResponse,
  GetTodayCheckInResponse,
  GetHistoryCheckInResponse,
} from '@shared/api.interface';

@Injectable()
export class CheckInService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase
  ) {}

  /**
   * 创建打卡记录
   */
  async createCheckIn(
    data: CreateCheckInRequest,
    organizationCode?: string
  ): Promise<CreateCheckInResponse> {
    if (!organizationCode) {
      throw new Error('organizationCode is required');
    }

    const today = new Date().toISOString().split('T')[0];

    const [result] = await this.db
      .insert(checkInRecords)
      .values({
        nickname: data.nickname,
        checkInDate: today,
        remark: data.remark || null,
        organizationCode: organizationCode || null,
      })
      .returning({
        id: checkInRecords.id,
        nickname: checkInRecords.nickname,
        checkInDate: checkInRecords.checkInDate,
        createdAt: checkInRecords.createdAt,
      });

    return {
      id: result.id,
      nickname: result.nickname,
      checkInDate: result.checkInDate,
      createdAt: result.createdAt.toISOString(),
    };
  }

  /**
   * 获取今日打卡记录列表
   */
  async getTodayCheckIn(organizationCode?: string): Promise<GetTodayCheckInResponse> {
    const today = new Date().toISOString().split('T')[0];

    const whereClause = organizationCode
      ? and(eq(checkInRecords.checkInDate, today), eq(checkInRecords.organizationCode, organizationCode))
      : eq(checkInRecords.checkInDate, today);

    const records = await this.db
      .select({
        id: checkInRecords.id,
        nickname: checkInRecords.nickname,
        checkInDate: checkInRecords.checkInDate,
        remark: checkInRecords.remark,
        createdAt: checkInRecords.createdAt,
      })
      .from(checkInRecords)
      .where(whereClause)
      .orderBy(desc(checkInRecords.createdAt));

    return {
      records: records.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      count: records.length,
    };
  }

  /**
   * 获取历史打卡记录列表
   */
  async getHistoryCheckIn(
    startDate?: string,
    endDate?: string,
    organizationCode?: string
  ): Promise<GetHistoryCheckInResponse> {
    const dateConditions: (ReturnType<typeof gte> | ReturnType<typeof lte>)[] = [];

    if (startDate && endDate) {
      dateConditions.push(
        gte(checkInRecords.checkInDate, startDate),
        lte(checkInRecords.checkInDate, endDate)
      );
    } else if (startDate) {
      dateConditions.push(gte(checkInRecords.checkInDate, startDate));
    } else if (endDate) {
      dateConditions.push(lte(checkInRecords.checkInDate, endDate));
    }

    let whereClause: ReturnType<typeof and> | undefined;
    if (dateConditions.length > 0 && organizationCode) {
      whereClause = and(
        ...dateConditions,
        eq(checkInRecords.organizationCode, organizationCode)
      );
    } else if (dateConditions.length > 0) {
      whereClause = and(...dateConditions);
    } else if (organizationCode) {
      whereClause = eq(checkInRecords.organizationCode, organizationCode);
    }

    const records = await this.db
      .select({
        id: checkInRecords.id,
        nickname: checkInRecords.nickname,
        checkInDate: checkInRecords.checkInDate,
        remark: checkInRecords.remark,
        createdAt: checkInRecords.createdAt,
      })
      .from(checkInRecords)
      .where(whereClause)
      .orderBy(desc(checkInRecords.checkInDate), desc(checkInRecords.createdAt));

    return {
      records: records.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      total: records.length,
    };
  }

  /**
   * 检查用户今日是否已打卡
   */
  async hasCheckedInToday(nickname: string, organizationCode?: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];

    const whereClause = organizationCode
      ? and(
          eq(checkInRecords.checkInDate, today),
          eq(checkInRecords.nickname, nickname),
          eq(checkInRecords.organizationCode, organizationCode)
        )
      : and(
          eq(checkInRecords.checkInDate, today),
          eq(checkInRecords.nickname, nickname)
        );

    const records = await this.db
      .select({ id: checkInRecords.id })
      .from(checkInRecords)
      .where(whereClause)
      .limit(1);

    return records.length > 0;
  }

  /**
   * 取消今日打卡（删除记录）
   */
  async cancelTodayCheckIn(nickname: string, organizationCode?: string): Promise<void> {
    if (!organizationCode) {
      throw new Error('organizationCode is required');
    }

    const today = new Date().toISOString().split('T')[0];

    const whereClause = and(
      eq(checkInRecords.checkInDate, today),
      eq(checkInRecords.nickname, nickname),
      eq(checkInRecords.organizationCode, organizationCode)
    );

    const result = await this.db
      .delete(checkInRecords)
      .where(whereClause)
      .returning({ id: checkInRecords.id });

    if (result.length === 0) {
      throw new Error('未找到匹配的打卡记录，可能已取消或日期不匹配');
    }
  }

  /**
   * 按ID删除打卡记录（支持删除任意日期的记录）
   */
  async deleteCheckInById(id: string): Promise<void> {
    await this.db
      .delete(checkInRecords)
      .where(eq(checkInRecords.id, id));
  }
}
