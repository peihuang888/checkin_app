import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUpIcon } from 'lucide-react';
import { getHistoryCheckIn } from '@/api';
import type { CheckInRecord } from '@shared/api.interface';
import { getStoredOrganization } from '@/utils/organization';

const TrendChartSection: React.FC = () => {
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const { code } = getStoredOrganization();
    if (!code) {
      setLoading(false);
      return;
    }

    try {
      const res = await getHistoryCheckIn(code);
      setRecords(res.records);
    } catch {
      setRecords([]);
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

  // 计算近7天每日打卡人数
  const chartData = useMemo(() => {
    const today = new Date();
    const dates: string[] = [];
    const counts: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const displayDate = `${date.getMonth() + 1}/${date.getDate()}`;

      dates.push(displayDate);

      // 统计该日期的打卡人数（按昵称去重）
      const dayRecords = records.filter((r) => r.checkInDate === dateStr);
      const uniqueUsers = new Set(dayRecords.map((r) => r.nickname));
      counts.push(uniqueUsers.size);
    }

    return { dates, counts };
  }, [records]);

  const option: EChartsOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>打卡人数: <strong>${data.value}人</strong>`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.dates,
        axisLine: {
          lineStyle: {
            color: '#e5e5e5',
          },
        },
        axisLabel: {
          color: '#737373',
          fontSize: 12,
        },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: '#737373',
          fontSize: 12,
        },
      },
      series: [
        {
          type: 'line',
          data: chartData.counts,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: '#f97316',
            width: 3,
          },
          itemStyle: {
            color: '#f97316',
            borderColor: '#fff',
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(249, 115, 22, 0.3)' },
                { offset: 1, color: 'rgba(249, 115, 22, 0.05)' },
              ],
            },
          },
        },
      ],
    }),
    [chartData]
  );

  // 计算总打卡人次
  const totalCount = useMemo(() => {
    return chartData.counts.reduce((sum, count) => sum + count, 0);
  }, [chartData]);

  if (loading) {
    return (
      <section className="w-full">
        <Card className="rounded-2xl shadow-sm border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <TrendingUpIcon className="size-5 text-primary" />
              近7天打卡趋势
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              加载中...
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="w-full">
      <Card className="rounded-2xl shadow-sm border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <TrendingUpIcon className="size-5 text-primary" />
            近7天打卡趋势
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-primary">
              {totalCount}
            </span>
            <span className="text-sm text-muted-foreground">人次</span>
          </div>
          <ReactECharts
            option={option}
            theme="ud"
            className="h-[280px] w-full"
            style={{ height: '280px' }}
          />
        </CardContent>
      </Card>
    </section>
  );
};

export default TrendChartSection;
