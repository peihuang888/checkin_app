import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  CreateCheckInRequest,
  CreateCheckInResponse,
  GetTodayCheckInResponse,
  GetHistoryCheckInResponse,
} from '@shared/api.interface';

/**
 * 获取组织列表
 */
export async function getOrganizations(): Promise<{ code: string; name: string }[]> {
  try {
    const response = await axiosForBackend({
      url: '/api/organizations',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取组织列表失败', error);
    throw error;
  }
}

/**
 * 创建打卡记录
 */
export async function createCheckIn(
  data: CreateCheckInRequest,
  organizationCode: string
): Promise<CreateCheckInResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/checkin',
      method: 'POST',
      params: { organizationCode },
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('创建打卡记录失败', error);
    throw error;
  }
}

/**
 * 获取今日打卡列表
 */
export async function getTodayCheckIn(organizationCode: string): Promise<GetTodayCheckInResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/checkin/today',
      method: 'GET',
      params: { organizationCode },
    });
    return response.data;
  } catch (error) {
    logger.error('获取今日打卡列表失败', error);
    throw error;
  }
}

/**
 * 获取历史打卡列表
 */
export async function getHistoryCheckIn(
  organizationCode: string,
  startDate?: string,
  endDate?: string
): Promise<GetHistoryCheckInResponse> {
  try {
    const params: Record<string, string> = { organizationCode };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axiosForBackend({
      url: '/api/checkin/history',
      method: 'GET',
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('获取历史打卡列表失败', error);
    throw error;
  }
}

/**
 * 检查今日打卡状态
 */
export async function checkTodayStatus(
  nickname: string,
  organizationCode: string
): Promise<{ hasCheckedIn: boolean }> {
  try {
    const response = await axiosForBackend({
      url: '/api/checkin/status',
      method: 'GET',
      params: { nickname, organizationCode },
    });
    return response.data;
  } catch (error) {
    logger.error('检查打卡状态失败', error);
    throw error;
  }
}

/**
 * 取消今日打卡
 */
export async function cancelCheckIn(
  nickname: string,
  organizationCode: string
): Promise<{ success: boolean }> {
  try {
    const response = await axiosForBackend({
      url: '/api/checkin/cancel',
      method: 'DELETE',
      params: { nickname, organizationCode },
    });
    return response.data;
  } catch (error) {
    logger.error('取消打卡失败', error);
    throw error;
  }
}

/**
 * 按ID删除打卡记录（支持删除任意日期的记录）
 */
export async function deleteCheckInById(id: string): Promise<{ success: boolean }> {
  try {
    const response = await axiosForBackend({
      url: `/api/checkin/${id}`,
      method: 'DELETE',
    });
    return response.data;
  } catch (error) {
    logger.error('删除打卡记录失败', error);
    throw error;
  }
}
