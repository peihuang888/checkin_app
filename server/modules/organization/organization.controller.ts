import { Controller, Get } from '@nestjs/common';
import { OrganizationService } from './organization.service';

@Controller('api/organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  /**
   * 获取组织列表
   * GET /api/organizations
   */
  @Get()
  async getOrganizations(): Promise<{ code: string; name: string }[]> {
    return this.organizationService.getActiveOrganizations();
  }
}
