import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserIcon } from 'lucide-react';
import { getTodayCheckIn } from '@/api';
import type { CheckInRecord } from '@shared/api.interface';
import { getStoredOrganization } from '@/utils/organization';

export default function TodayListSection() {
  const [todayRecords, setTodayRecords] = useState<CheckInRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTodayRecords = async () => {
    const { code } = getStoredOrganization();
    if (!code) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await getTodayCheckIn(code);
      // 按创建时间倒序排列
      const sorted = [...result.records].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTodayRecords(sorted);
    } catch {
      toast.error('加载打卡列表失败');
      setTodayRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodayRecords();

    // 监听打卡更新事件，实现同页面内实时同步
    const handleCheckInUpdate = () => {
      loadTodayRecords();
    };

    window.addEventListener('checkin-updated', handleCheckInUpdate);
    window.addEventListener('organization-changed', handleCheckInUpdate);

    // 定时刷新（每5秒检查一次，作为兜底）
    const interval = setInterval(loadTodayRecords, 5000);

    return () => {
      window.removeEventListener('checkin-updated', handleCheckInUpdate);
      window.removeEventListener('organization-changed', handleCheckInUpdate);
      clearInterval(interval);
    };
  }, []);

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  if (isLoading) {
    return (
      <section className="w-full">
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <h3 className="text-base font-semibold text-foreground mb-4">今日打卡</h3>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p className="text-sm">加载中...</p>
          </div>
        </div>
      </section>
    );
  }

  if (todayRecords.length === 0) {
    return (
      <section className="w-full">
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <h3 className="text-base font-semibold text-foreground mb-4">今日打卡</h3>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-3">
              <UserIcon className="w-8 h-8 text-accent-foreground/50" />
            </div>
            <p className="text-sm">还没有人打卡</p>
            <p className="text-xs mt-1">快来成为第一个打卡的人吧！</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">今日打卡</h3>
          <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded-full">
            共 {todayRecords.length} 人
          </span>
        </div>
        
        <div className="space-y-2">
           {todayRecords.map((record, index) => (
            <div
              key={record.id}
              className="flex items-center gap-3 p-3 bg-accent/50 rounded-xl hover:bg-accent transition-colors duration-200"
            >
              {/* 排名序号 */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  index === 0
                    ? 'bg-yellow-400 text-yellow-900'
                    : index === 1
                    ? 'bg-slate-300 text-slate-700'
                    : index === 2
                    ? 'bg-amber-600 text-amber-100'
                    : 'bg-accent text-accent-foreground'
                }`}
              >
                {index + 1}
              </div>
              
              {/* 用户信息 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {record.nickname}
                </p>
              </div>
              
              {/* 打卡时间 */}
              <div className="text-xs text-muted-foreground font-mono shrink-0">
                {formatTime(record.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
