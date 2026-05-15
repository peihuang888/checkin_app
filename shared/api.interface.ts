/**
 * 打卡记录接口定义
 * 前后端共享类型
 */

/** 打卡记录数据结构 */
export interface CheckInRecord {
  id: string;
  nickname: string;
  checkInDate: string;
  remark?: string;
  createdAt: string;
}

/** 创建打卡记录请求 */
export interface CreateCheckInRequest {
  nickname: string;
  remark?: string;
}

/** 创建打卡记录响应 */
export interface CreateCheckInResponse {
  id: string;
  nickname: string;
  checkInDate: string;
  createdAt: string;
}

/** 获取今日打卡列表响应 */
export interface GetTodayCheckInResponse {
  records: CheckInRecord[];
  count: number;
}

/** 获取历史打卡列表请求 */
export interface GetHistoryCheckInRequest {
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

/** 获取历史打卡列表响应 */
export interface GetHistoryCheckInResponse {
  records: CheckInRecord[];
  total: number;
}
