import { useState, useEffect } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const FILTER_STORAGE_KEY = '__global_history_filter_date';

export default function DateFilterSection() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const today = new Date();
  const yesterday = addDays(today, -1);

  const filterOptions = [
    { key: 'all', label: '全部', getDate: () => null },
    { key: 'today', label: '今天', getDate: () => today },
    { key: 'yesterday', label: '昨天', getDate: () => yesterday },
    { key: 'week', label: '本周', getDate: () => startOfWeek(today, { locale: zhCN }) },
  ];

  // 初始化从 localStorage 读取
  useEffect(() => {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date) {
          setSelectedDate(new Date(parsed.date));
          setActiveFilter(parsed.filter || 'custom');
        } else {
          setSelectedDate(null);
          setActiveFilter('all');
        }
      } catch {
        setSelectedDate(null);
        setActiveFilter('all');
      }
    }
  }, []);

  // 同步到 localStorage
  const syncFilter = (date: Date | null, filter: string) => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
      date: date ? date.toISOString() : null,
      filter
    }));
    // 触发事件通知列表更新
    window.dispatchEvent(new Event('history-filter-updated'));
  };

  const handleFilterClick = (key: string, getDate: () => Date | null) => {
    setActiveFilter(key);
    const date = getDate();
    setSelectedDate(date);
    syncFilter(date, key);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setActiveFilter('custom');
      setCalendarOpen(false);
      syncFilter(date, 'custom');
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (selectedDate) {
      const newDate = addDays(selectedDate, direction === 'prev' ? -1 : 1);
      setSelectedDate(newDate);
      setActiveFilter('custom');
      syncFilter(newDate, 'custom');
    }
  };

  const formatDisplayDate = () => {
    if (!selectedDate) return '全部记录';
    if (isSameDay(selectedDate, today)) return '今天';
    if (isSameDay(selectedDate, yesterday)) return '昨天';
    return format(selectedDate, 'M月d日', { locale: zhCN });
  };

  return (
    <section className="w-full">
      <h2 className="text-lg font-semibold text-foreground mb-3">历史记录</h2>
      {/* 快速筛选标签 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filterOptions.map((option) => (
          <Button
            key={option.key}
            variant={activeFilter === option.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterClick(option.key, option.getDate)}
            className={`
              rounded-full text-xs font-medium whitespace-nowrap px-4 py-2 h-9
              ${
                activeFilter === option.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border-border text-foreground hover:bg-accent'
              }
            `}
          >
            {option.label}
          </Button>
        ))}

        {/* 日期选择器 */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={activeFilter === 'custom' ? 'default' : 'outline'}
              size="sm"
              className={`
                rounded-full text-xs font-medium whitespace-nowrap px-4 py-2 h-9 gap-1.5
                ${
                  activeFilter === 'custom'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border-border text-foreground hover:bg-accent'
                }
              `}
            >
              <CalendarIcon className="size-3.5" />
              {activeFilter === 'custom' && selectedDate
                ? format(selectedDate, 'M/d', { locale: zhCN })
                : '选择日期'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDateSelect}
              locale={zhCN}
              className="rounded-md border-0"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 当前筛选状态展示 */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">筛选:</span>
          <span className="text-sm font-medium text-foreground">{formatDisplayDate()}</span>
        </div>

        {selectedDate && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate('prev')}
              className="size-7 rounded-full hover:bg-accent"
            >
              <ChevronLeftIcon className="size-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate('next')}
              className="size-7 rounded-full hover:bg-accent"
            >
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
