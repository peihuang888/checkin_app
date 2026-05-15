import { useEffect, useState } from 'react';
import { UsersIcon, ClockIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getTodayCheckIn } from '@/api';
import { getStoredOrganization } from '@/utils/organization';

export default function HeaderSection() {
  const [todayCount, setTodayCount] = useState(0);
  const [earliestTime, setEarliestTime] = useState<string>('--:--');

  useEffect(() => {
    const loadStats = async () => {
      const { code } = getStoredOrganization();
      if (!code) return;

      try {
        const { records } = await getTodayCheckIn(code);
        setTodayCount(records.length);

        if (records.length > 0) {
          const earliest = records.reduce((min, r) =>
            new Date(r.createdAt).getTime() < new Date(min.createdAt).getTime() ? r : min
          );
          const time = new Date(earliest.createdAt);
          setEarliestTime(`${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`);
        } else {
          setEarliestTime('--:--');
        }
      } catch {
        setTodayCount(0);
        setEarliestTime('--:--');
      }
    };

    loadStats();
    window.addEventListener('checkin-updated', loadStats);
    return () => window.removeEventListener('checkin-updated', loadStats);
  }, []);

  return (
    <section className="w-full">
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between gap-4">
          <Card className="flex-1 bg-card/80 backdrop-blur-sm border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <UsersIcon className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">今日打卡</p>
                <p className="text-2xl font-bold text-foreground">
                  {todayCount}
                  <span className="text-sm font-normal text-muted-foreground ml-1">人</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 bg-card/80 backdrop-blur-sm border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <ClockIcon className="size-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">最早打卡</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  {earliestTime}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
