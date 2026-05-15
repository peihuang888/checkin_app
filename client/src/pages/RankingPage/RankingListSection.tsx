import { useState, useEffect } from 'react';
import { MedalIcon, UserIcon, TrophyIcon } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getHistoryCheckIn } from '@/api';
import type { CheckInRecord } from '@shared/api.interface';
import { getStoredOrganization } from '@/utils/organization';

interface IRankingItem {
  nickname: string;
  totalCount: number;
  lastCheckIn: string;
}

const getRankBadgeStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-yellow-400 text-yellow-900';
    case 2:
      return 'bg-slate-300 text-slate-700';
    case 3:
      return 'bg-amber-600 text-amber-100';
    default:
      return 'bg-accent text-accent-foreground';
  }
};

const getRankIcon = (rank: number) => {
  if (rank <= 3) {
    return <MedalIcon className="size-4" />;
  }
  return null;
};

const formatTime = (createdAt: string) => {
  const timestamp = new Date(createdAt).getTime();
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - timestamp) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
};

export default function RankingListSection() {
  const [rankingList, setRankingList] = useState<IRankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const { code } = getStoredOrganization();
    if (!code) {
      setLoading(false);
      return;
    }

    try {
      const res = await getHistoryCheckIn(code);
      const records: CheckInRecord[] = res.records;

      // 按用户统计打卡次数和最近打卡时间
      const userStats: Record<string, { totalCount: number; lastCheckIn: string }> = {};

      records.forEach((record) => {
        if (!userStats[record.nickname]) {
          userStats[record.nickname] = { totalCount: 0, lastCheckIn: '' };
        }
        userStats[record.nickname].totalCount += 1;
        // 比较 createdAt 字符串，保留最新的
        if (!userStats[record.nickname].lastCheckIn || record.createdAt > userStats[record.nickname].lastCheckIn) {
          userStats[record.nickname].lastCheckIn = record.createdAt;
        }
      });

      // 转换为数组并按打卡次数降序排列
      const sortedList: IRankingItem[] = Object.entries(userStats)
        .map(([nickname, stats]) => ({
          nickname,
          totalCount: stats.totalCount,
          lastCheckIn: stats.lastCheckIn,
        }))
        .sort((a, b) => {
          // 先按打卡次数降序
          if (b.totalCount !== a.totalCount) {
            return b.totalCount - a.totalCount;
          }
          // 次数相同时按最近打卡时间降序（ISO 字符串可直接比较）
          return b.lastCheckIn.localeCompare(a.lastCheckIn);
        });

      setRankingList(sortedList);
    } catch (error) {
      logger.error('加载排行榜数据失败:', String(error));
      setRankingList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('checkin-updated', handleUpdate);
    window.addEventListener('organization-changed', handleUpdate);
    return () => {
      window.removeEventListener('checkin-updated', handleUpdate);
      window.removeEventListener('organization-changed', handleUpdate);
    };
  }, []);

  if (loading) {
    return (
      <section className="w-full space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-card rounded-xl p-4 flex items-center gap-3 animate-pulse"
          >
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
            <div className="h-6 bg-muted rounded w-12" />
          </div>
        ))}
      </section>
    );
  }

  if (rankingList.length === 0) {
    return (
      <section className="w-full">
        <div className="bg-card rounded-2xl p-8 text-center border border-border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
            <TrophyIcon className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            暂无排行榜数据
          </h3>
          <p className="text-sm text-muted-foreground">
            快去打卡，成为第一个上榜的人吧！
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full space-y-3">
      {rankingList.map((item, index) => {
        const rank = index + 1;
        const isTopThree = rank <= 3;

        return (
          <div
            key={item.nickname}
            className={`bg-card rounded-xl p-4 flex items-center gap-3 shadow-sm border border-border transition-all duration-200 hover:shadow-md ${
              isTopThree ? 'ring-1 ring-primary/20' : ''
            }`}
          >
            {/* 排名标识 */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getRankBadgeStyle(
                rank
              )}`}
            >
              {getRankIcon(rank) || rank}
            </div>

            {/* 用户头像占位 */}
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
              <UserIcon className="size-5 text-accent-foreground" />
            </div>

            {/* 用户信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground truncate">
                  {item.nickname}
                </span>
                {isTopThree && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                    TOP {rank}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                最近打卡: {formatTime(item.lastCheckIn)}
              </p>
            </div>

            {/* 打卡次数 */}
            <div className="text-right shrink-0">
              <div className="flex items-baseline gap-0.5">
                <span
                  className={`text-2xl font-bold ${
                    isTopThree ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {item.totalCount}
                </span>
                <span className="text-xs text-muted-foreground">次</span>
              </div>
              <p className="text-xs text-muted-foreground">累计打卡</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
