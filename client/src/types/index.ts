// client/src/types/index.ts

/** 打卡记录数据结构 */
export interface ICheckInRecord {
  /** 记录唯一ID */
  id: string;
  /** 打卡人昵称 */
  nickname: string;
  /** 打卡时间戳 */
  timestamp: number;
  /** 打卡日期（YYYY-MM-DD格式，便于按天分组） */
  date: string;
  /** 备注信息 */
  remark?: string;
}

/** 统计数据缓存结构 */
export interface ICheckInStats {
  /** 按昵称统计的总打卡次数 */
  totalByUser: Record<string, number>;
  /** 按昵称统计的当前连续打卡天数 */
  streakByUser: Record<string, number>;
  /** 每日打卡人数统计（用于趋势图） */
  dailyCount: Record<string, number>;
}

// 导出其他类型
export * from './common';
