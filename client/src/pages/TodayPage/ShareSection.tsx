import React, { useState, useEffect, useCallback } from 'react';
import { CopyIcon, CheckIcon, Share2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getTodayCheckIn } from '@/api';
import { getStoredOrganization } from '@/utils/organization';
import type { CheckInRecord } from '@shared/api.interface';

const ShareSection: React.FC = () => {
  const [todayRecords, setTodayRecords] = useState<CheckInRecord[]>([]);
  const [copied, setCopied] = useState(false);

  // 获取今日日期字符串 YYYY-MM-DD
  const getTodayDateString = useCallback(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  // 格式化日期为中文显示
  const formatChineseDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  }, []);

  // 格式化时间 HH:MM:SS
  const formatTime = useCallback((createdAt: string) => {
    const date = new Date(createdAt);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }, []);

  // 加载今日打卡记录
  useEffect(() => {
    const loadRecords = async () => {
      const { code } = getStoredOrganization();
      if (!code) return;

      try {
        const { records } = await getTodayCheckIn(code);
        const todayList = records
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setTodayRecords(todayList);
      } catch (error) {
        logger.error('Failed to load records:', String(error));
      }
    };

    loadRecords();
    window.addEventListener('checkin-updated', loadRecords);
    return () => window.removeEventListener('checkin-updated', loadRecords);
  }, []);

  // 生成接龙文本
  const generateChainText = useCallback(() => {
    if (todayRecords.length === 0) {
      return `📅 ${formatChineseDate(getTodayDateString())} 打卡接龙\n\n今日暂无打卡记录\n\n—— 共0人完成今日打卡 ——`;
    }

    const lines = todayRecords.map((record, index) => {
      const timeStr = formatTime(record.createdAt);
      return `${index + 1}. ${record.nickname} ${timeStr}`;
    });

    return `📅 ${formatChineseDate(getTodayDateString())} 打卡接龙\n\n${lines.join('\n')}\n\n—— 共${todayRecords.length}人完成今日打卡 ——`;
  }, [todayRecords, formatChineseDate, getTodayDateString, formatTime]);

  // 复制到剪贴板
  const handleCopy = async () => {
    const text = generateChainText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('接龙文本已复制到剪贴板', {
        description: '快去微信群粘贴分享吧！',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  };

  // 如果没有今日记录，显示提示
  if (todayRecords.length === 0) {
    return (
      <section className="w-full">
        <Card className="rounded-2xl shadow-sm border border-border bg-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Share2Icon className="size-5 text-primary" />
              生成接龙
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="bg-muted/30 rounded-xl p-4 text-center">
              <p className="text-muted-foreground text-sm">
                今日还没有人打卡，先点击上方按钮完成今日打卡吧！
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="w-full">
      <Card className="rounded-2xl shadow-sm border border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Share2Icon className="size-5 text-primary" />
            生成接龙
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          {/* 接龙文本预览区 */}
          <div className="relative">
            <div className="bg-muted/30 rounded-xl p-4 font-mono text-sm text-foreground border border-border whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
              {generateChainText()}
            </div>
          </div>

          {/* 复制按钮 */}
          <Button
            onClick={handleCopy}
            className={`w-full h-12 rounded-xl font-medium transition-all duration-200 ${
              copied
                ? 'bg-success text-success-foreground hover:bg-success/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {copied ? (
              <>
                <CheckIcon className="size-5 mr-2" />
                已复制
              </>
            ) : (
              <>
                <CopyIcon className="size-5 mr-2" />
                一键复制接龙文本
              </>
            )}
          </Button>

          {/* 分享提示 */}
          <p className="text-xs text-muted-foreground text-center">
            复制后粘贴到微信群聊，即可完成分享
          </p>
        </CardContent>
      </Card>
    </section>
  );
};

export default ShareSection;
