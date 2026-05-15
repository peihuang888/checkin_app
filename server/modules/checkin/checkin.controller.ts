import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { CheckInService } from './checkin.service';
import type {
  CreateCheckInRequest,
  CreateCheckInResponse,
  GetTodayCheckInResponse,
  GetHistoryCheckInResponse,
} from '@shared/api.interface';

@Controller('api/checkin')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  /**
   * 创建打卡记录
   * POST /api/checkin?organizationCode=xxx
   */
  @Post()
  async create(
    @Body() data: CreateCheckInRequest,
    @Query('organizationCode') organizationCode?: string
  ): Promise<CreateCheckInResponse> {
    return this.checkInService.createCheckIn(data, organizationCode);
  }

  /**
   * 获取今日打卡记录列表
   * GET /api/checkin/today?organizationCode=xxx
   */
  @Get('today')
  async getToday(
    @Query('organizationCode') organizationCode?: string
  ): Promise<GetTodayCheckInResponse> {
    return this.checkInService.getTodayCheckIn(organizationCode);
  }

  /**
   * 获取历史打卡记录列表
   * GET /api/checkin/history?startDate=xxx&endDate=xxx&organizationCode=xxx
   */
  @Get('history')
  async getHistory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('organizationCode') organizationCode?: string
  ): Promise<GetHistoryCheckInResponse> {
    return this.checkInService.getHistoryCheckIn(startDate, endDate, organizationCode);
  }

  /**
   * 检查用户今日是否已打卡
   * GET /api/checkin/status?nickname=xxx&organizationCode=xxx
   */
  @Get('status')
  async checkStatus(
    @Query('nickname') nickname: string,
    @Query('organizationCode') organizationCode?: string
  ): Promise<{ hasCheckedIn: boolean }> {
    const hasCheckedIn = await this.checkInService.hasCheckedInToday(nickname, organizationCode);
    return { hasCheckedIn };
  }

  /**
   * 取消今日打卡（删除今日打卡记录）
   * DELETE /api/checkin/cancel?nickname=xxx&organizationCode=xxx
   */
  @Delete('cancel')
  @NeedLogin()
  async cancelCheckIn(
    @Query('nickname') nickname: string,
    @Query('organizationCode') organizationCode?: string
  ): Promise<{ success: boolean }> {
    try {
      await this.checkInService.cancelTodayCheckIn(nickname, organizationCode);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '取消打卡失败';
      if (errorMessage.includes('未找到匹配') || errorMessage.includes('organizationCode is required')) {
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * 按ID删除打卡记录（支持删除任意日期的记录）
   * DELETE /api/checkin/:id
   */
  @Delete(':id')
  @NeedLogin()
  async deleteCheckIn(
    @Param('id') id: string
  ): Promise<{ success: boolean }> {
    await this.checkInService.deleteCheckInById(id);
    return { success: true };
  }
}
