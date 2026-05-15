import { useEffect, useState } from 'react';
import { TrophyIcon, FlameIcon, CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getHistoryCheckIn } from '@/api';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { CheckInRecord } from '@shared/api.interface';
import { getStoredOrganization, getStoredNickname } from '@/utils/organization';

export default function RankingHeaderSection() {
  const [myNickname, setMyNickname] = useState('微信用户');
  const [totalCount, setTotalCount] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
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

      const currentNickname = getStoredNickname(code) || '微信用户';
      setMyNickname(currentNickname);

      // 统计我的总打卡次数
      const myRecords = records.filter(r => r.nickname === currentNickname);
      setTotalCount(myRecords.length);

      // 计算连续打卡天数
      const streak = calculateStreak(records, currentNickname);
      setStreakDays(streak);
    } catch (error) {
      logger.error('加载排行榜头部数据失败:', String(error));
      setTotalCount(0);
      setStreakDays(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('checkin-updated', handleUpdate);
    window.addEventListener('organization-changed', handleUpdate);
    window.addEventListener('nickname-updated', handleUpdate);
    return () => {
      window.removeEventListener('checkin-updated', handleUpdate);
      window.removeEventListener('organization-changed', handleUpdate);
      window.removeEventListener('nickname-updated', handleUpdate);
    };
  }, []);

  // 计算连续打卡天数
  const calculateStreak = (records: CheckInRecord[], nickname: string): number => {
    const myRecords = records.filter(r => r.nickname === nickname);
    if (myRecords.length === 0) return 0;

    // 获取所有有打卡的日期（去重，按日期排序）
    const dates = [...new Set(myRecords.map(r => r.checkInDate))].sort().reverse();
    if (dates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // 如果今天没打卡，且昨天也没打卡，则连续天数为0
    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000);

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  if (loading) {
    return (
      <section className="w-full">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 rounded-2xl overflow-hidden">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-16 mx-auto mb-2" />
                <div className="h-8 bg-muted rounded w-12 mx-auto" />
              </div>
              <div className="bg-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-16 mx-auto mb-2" />
                <div className="h-8 bg-muted rounded w-12 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="w-full">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 rounded-2xl overflow-hidden">
        <CardContent className="p-5">
          {/* 标题区域 */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <TrophyIcon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">我的打卡数据</span>
          </div>

          {/* 数据展示 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 累计打卡 */}
            <div className="bg-card rounded-xl p-4 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">累计打卡</span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-foreground">{totalCount}</span>
                <span className="text-sm text-muted-foreground">次</span>
              </div>
            </div>

            {/* 连续打卡 */}
            <div className="bg-card rounded-xl p-4 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <FlameIcon className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">连续打卡</span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-foreground">{streakDays}</span>
                <span className="text-sm text-muted-foreground">天</span>
              </div>
            </div>
          </div>

          {/* 用户昵称 */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">当前用户</span>
              <span className="text-sm font-medium text-foreground">{myNickname}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
