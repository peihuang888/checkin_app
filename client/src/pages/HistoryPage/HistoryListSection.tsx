import { useState, useEffect, useMemo } from 'react';
import { Trash2Icon, ClockIcon, UserIcon, AlertTriangleIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { getHistoryCheckIn, deleteCheckInById } from '@/api';
import type { CheckInRecord } from '@shared/api.interface';
import { isSameDay } from 'date-fns';
import { getStoredOrganization } from '@/utils/organization';

const FILTER_STORAGE_KEY = '__global_history_filter_date';

interface IGroupedRecords {
  date: string;
  records: CheckInRecord[];
}

export default function HistoryListSection() {
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CheckInRecord | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 从 API 加载数据
  const loadData = async () => {
    const { code } = getStoredOrganization();
    if (!code) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getHistoryCheckIn(code);
      setRecords(result.records);
    } catch {
      toast.error('加载历史记录失败');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 监听打卡更新事件
    const handleCheckInUpdate = () => {
      loadData();
    };

    // 监听筛选变化事件
    const handleFilterUpdate = () => {
      try {
        const filterStored = localStorage.getItem(FILTER_STORAGE_KEY);
        if (filterStored) {
          const parsed = JSON.parse(filterStored);
          if (parsed.date) {
            setFilterDate(new Date(parsed.date));
          } else {
            setFilterDate(null);
          }
        }
      } catch {
        setFilterDate(null);
      }
    };

    window.addEventListener('checkin-updated', handleCheckInUpdate);
    window.addEventListener('organization-changed', handleCheckInUpdate);
    window.addEventListener('history-filter-updated', handleFilterUpdate);
    
    // 初始化筛选日期
    handleFilterUpdate();
    
    return () => {
      window.removeEventListener('checkin-updated', handleCheckInUpdate);
      window.removeEventListener('organization-changed', handleCheckInUpdate);
      window.removeEventListener('history-filter-updated', handleFilterUpdate);
    };
  }, []);

  // 按日期分组并倒序排列（应用筛选）
  const groupedRecords: IGroupedRecords[] = useMemo(() => {
    // 先根据筛选日期过滤
    let filteredRecords = records;
    if (filterDate) {
      filteredRecords = records.filter((r) => {
        const recordDate = new Date(r.checkInDate);
        return isSameDay(recordDate, filterDate);
      });
    }

    const groups: Record<string, CheckInRecord[]> = {};
    
    filteredRecords.forEach((record) => {
      if (!groups[record.checkInDate]) {
        groups[record.checkInDate] = [];
      }
      groups[record.checkInDate].push(record);
    });

    // 对每个日期组内按时间倒序排列
    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
    });

    // 按日期倒序排列
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((date) => ({
        date,
        records: groups[date],
      }));
  }, [records, filterDate]);

  // 格式化日期显示
  const formatDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return '今天';
    if (isYesterday) return '昨天';

    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 格式化时间
  const formatTime = (createdAt: string): string => {
    const date = new Date(createdAt);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  // 打开删除确认对话框
  const handleDeleteClick = (record: CheckInRecord) => {
    setDeleteTarget(record);
    setIsDeleteDialogOpen(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const { code } = getStoredOrganization();
    if (!code) return;

    try {
      // 调用 API 删除记录（使用ID删除，支持任意日期）
      await deleteCheckInById(deleteTarget.id);
      
      // 刷新列表
      await loadData();
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
      toast.success('记录已删除');
      
      // 触发打卡更新事件，通知其他组件刷新
      window.dispatchEvent(new Event('checkin-updated'));
    } catch {
      toast.error('删除失败，请重试');
    }
  };

  // 取消删除
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <section className="w-full">
        <Card className="p-8 text-center bg-card border-border">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <ClockIcon className="w-8 h-8 text-accent-foreground animate-pulse" />
            </div>
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </Card>
      </section>
    );
  }

  if (records.length === 0) {
    return (
      <section className="w-full">
        <Card className="p-8 text-center bg-card border-border">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <ClockIcon className="w-8 h-8 text-accent-foreground" />
            </div>
            <p className="text-muted-foreground">暂无打卡记录</p>
            <p className="text-sm text-muted-foreground">
              快去今日打卡页面完成首次打卡吧
            </p>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="w-full space-y-4">
      {groupedRecords.map((group) => (
        <div key={group.date} className="space-y-3">
          {/* 日期标题 */}
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {formatDateLabel(group.date)}
            </h3>
            <span className="text-xs text-muted-foreground">
              共 {group.records.length} 人打卡
            </span>
          </div>

          {/* 该日期的打卡记录列表 */}
          <div className="space-y-2">
            {group.records.map((record) => (
              <Card
                key={record.id}
                className="p-4 bg-accent/50 hover:bg-accent border-0 rounded-xl transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* 用户头像占位 */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    
                    {/* 用户信息 */}
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">
                        {record.nickname}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatTime(record.createdAt)}
                      </span>
                    </div>
                  </div>


                </div>

                {/* 备注信息 */}
                {record.remark && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                      备注：{record.remark}
                    </p>
                  </div>
                )}
                {/* 删除按钮 */}
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteClick(record)}
                  >
                    <Trash2Icon className="w-3 h-3 mr-1" />
                    删除
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangleIcon className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle className="text-base">确认删除</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  确定要删除这条打卡记录吗？此操作无法撤销。
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={cancelDelete}
              className="flex-1 h-12 rounded-xl"
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="flex-1 h-12 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
