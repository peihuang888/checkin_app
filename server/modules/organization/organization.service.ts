import { Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { organizations } from '../../database/schema';

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase
  ) {}

  /**
   * 获取所有启用的组织列表
   */
  async getActiveOrganizations(): Promise<{ code: string; name: string }[]> {
    const result = await this.db
      .select({
        code: organizations.code,
        name: organizations.name,
      })
      .from(organizations)
      .where(eq(organizations.isActive, true))
      .orderBy(organizations.name);

    return result;
  }
}
