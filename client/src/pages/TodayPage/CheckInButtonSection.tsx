import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2Icon, UserCheckIcon, UserIcon, PencilIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createCheckIn, checkTodayStatus, cancelCheckIn } from '@/api';
import { showConfirm } from '@lark-apaas/client-toolkit';
import { getStoredOrganization, getStoredNickname, setStoredNickname } from '@/utils/organization';
import { logger } from '@lark-apaas/client-toolkit/logger';

export default function CheckInButtonSection() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentNickname, setCurrentNickname] = useState(() => {
    const { code } = getStoredOrganization();
    return code ? getStoredNickname(code) : '';
  });

  // 使用 ref 保存最新 nickname，避免闭包陷阱
  const nicknameRef = useRef(currentNickname);
  nicknameRef.current = currentNickname;

  // 昵称设置弹窗状态
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);
  const [tempNickname, setTempNickname] = useState('');

  // 编辑昵称弹窗状态
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editNickname, setEditNickname] = useState('');

  // 组件挂载时检查今日打卡状态
  useEffect(() => {
    if (!currentNickname) return;

    const checkStatus = async () => {
      const { code } = getStoredOrganization();
      if (!code) return;

      try {
        const result = await checkTodayStatus(currentNickname, code);
        setIsCheckedIn(result.hasCheckedIn);
      } catch {
        // 检查失败不影响用户操作
      }
    };
    checkStatus();
  }, [currentNickname]);

  // 监听组织变化，重新加载对应昵称
  useEffect(() => {
    const handleOrgChange = () => {
      const { code } = getStoredOrganization();
      if (code) {
        setCurrentNickname(getStoredNickname(code));
      } else {
        setCurrentNickname('');
      }
    };

    window.addEventListener('organization-changed', handleOrgChange);
    return () => window.removeEventListener('organization-changed', handleOrgChange);
  }, []);

  // 执行打卡操作
  const doCheckIn = useCallback(async (nickname: string) => {
    const { code } = getStoredOrganization();
    if (!code) {
      toast.error('请先选择组织');
      return;
    }

    try {
      await createCheckIn({ nickname }, code);
      setIsCheckedIn(true);
      toast.success('打卡成功！');
      // 延迟确保后端数据已同步（解决移动端网络延迟问题）
      await new Promise(resolve => setTimeout(resolve, 300));
      window.dispatchEvent(new CustomEvent('checkin-updated'));
    } catch {
      toast.error('打卡失败，请重试');
    }
  }, []);



  // 获取按钮文案
  const getButtonText = () => {
    const { code } = getStoredOrganization();
    if (code === 'team-alpha') return 'SJ打卡';
    if (code === 'team-beta') return '慈经打卡';
    return '立即打卡';
  };

  const handleCheckIn = useCallback(async () => {
    if (isCheckedIn) {
      // 取消打卡逻辑（直接内联避免闭包陷阱）
      const nickname = nicknameRef.current;
      if (!nickname) return;

      const { code } = getStoredOrganization();
      if (!code) return;

      const confirmed = await showConfirm('确定要取消今日打卡吗？');
      if (!confirmed) return;

      try {
        await cancelCheckIn(nickname, code);
        setIsCheckedIn(false);
        // 延迟确保后端数据已同步
        await new Promise(resolve => setTimeout(resolve, 300));
        window.dispatchEvent(new CustomEvent('checkin-updated'));
        toast.success('已取消今日打卡');
      } catch (err) {
        logger.error('取消打卡失败:', String(err));
        toast.error('取消打卡失败，请重试');
      }
      return;
    }

    // 已有昵称，直接打卡
    if (currentNickname) {
      doCheckIn(currentNickname);
      return;
    }

    // 首次打卡，需要设置昵称
    setTempNickname('');
    setShowNicknameDialog(true);
  }, [isCheckedIn, currentNickname, doCheckIn]);

  // 确认设置昵称
  const handleConfirmNickname = useCallback(() => {
    const trimmed = tempNickname.trim();
    if (!trimmed) {
      toast.error('昵称不能为空');
      return;
    }

    // 保存昵称到 LocalStorage
    const { code } = getStoredOrganization();
    if (code) {
      setStoredNickname(code, trimmed);
    }
    setCurrentNickname(trimmed);
    setShowNicknameDialog(false);

    // 自动执行打卡
    doCheckIn(trimmed);
  }, [tempNickname, doCheckIn]);

  // 取消设置昵称
  const handleCancelNickname = useCallback(() => {
    setShowNicknameDialog(false);
    setTempNickname('');
  }, []);

  // 打开编辑昵称弹窗
  const handleOpenEditDialog = useCallback(() => {
    setEditNickname(currentNickname);
    setShowEditDialog(true);
  }, [currentNickname]);

  // 确认修改昵称
  const handleConfirmEditNickname = useCallback(async () => {
    const trimmed = editNickname.trim();
    if (!trimmed) {
      toast.error('昵称不能为空');
      return;
    }

    // 保存昵称到 LocalStorage
    const { code } = getStoredOrganization();
    if (code) {
      setStoredNickname(code, trimmed);
    }

    // 先关闭弹窗，让用户可以继续操作
    setShowEditDialog(false);

    // 使用函数式更新确保获取最新值
    setCurrentNickname(() => trimmed);

    // 重新检查打卡状态（因为打卡状态是按昵称查询的）
    if (code) {
      try {
        const result = await checkTodayStatus(trimmed, code);
        setIsCheckedIn(result.hasCheckedIn);
      } catch {
        // 检查失败不影响用户操作
      }
    }

    // 触发昵称更新事件，通知其他组件刷新
    window.dispatchEvent(new Event('nickname-updated'));

    toast.success('昵称已更新');
  }, [editNickname]);

  // 取消编辑昵称
  const handleCancelEditNickname = useCallback(() => {
    setShowEditDialog(false);
    setEditNickname('');
  }, []);

  return (
    <section className="w-full space-y-3">
       {/* 当前用户标识 */}
       {currentNickname && (
         <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
           <UserIcon className="size-4" />
           <span>当前用户：{currentNickname}</span>
           <button
             onClick={handleOpenEditDialog}
             className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
             type="button"
           >
             <PencilIcon className="size-3" />
             编辑
           </button>
         </div>
       )}

       <motion.button
         onClick={handleCheckIn}
         whileTap={!isCheckedIn ? { scale: 0.97 } : undefined}
         transition={{ type: 'spring', stiffness: 400, damping: 25 }}
         className={`
           w-full h-20 rounded-2xl
           flex items-center justify-center gap-3
           text-xl font-semibold
           shadow-lg
           transition-colors duration-300
           ${
             isCheckedIn
               ? 'bg-success text-white shadow-success/25 hover:bg-success/90 cursor-pointer'
               : 'bg-primary text-white shadow-primary/25 hover:bg-primary/90 cursor-pointer active-elevate-2'
           }
         `}
       >
          {isCheckedIn ? (
            <>
              <CheckCircle2Icon className="size-6" />
              <span>今日已打卡</span>
            </>
          ) : (
           <>
             <UserCheckIcon className="size-6" />
              <span>{getButtonText()}</span>
           </>
         )}
       </motion.button>

      <p className="text-center text-sm text-muted-foreground">
        {isCheckedIn
          ? '感谢您今日的坚持，继续保持！'
          : '点击按钮完成今日打卡'}
      </p>

       {/* 昵称设置弹窗 */}
       <Dialog open={showNicknameDialog} onOpenChange={setShowNicknameDialog}>
         <DialogContent className="max-w-sm rounded-2xl">
           <DialogHeader>
             <DialogTitle className="text-lg">设置昵称</DialogTitle>
             <DialogDescription className="text-sm text-muted-foreground">
               首次打卡需要设置您的昵称，用于在打卡记录中标识身份
             </DialogDescription>
           </DialogHeader>

           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label htmlFor="nickname" className="text-sm font-medium">
                 您的昵称
               </Label>
               <Input
                 id="nickname"
                 placeholder="请输入您的昵称"
                 value={tempNickname}
                 onChange={(e) => setTempNickname(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     handleConfirmNickname();
                   }
                 }}
                 className="h-12 rounded-xl"
                 autoFocus
               />
             </div>

             <div className="flex gap-3">
               <Button
                 variant="outline"
                 onClick={handleCancelNickname}
                 className="flex-1 h-12 rounded-xl"
               >
                 取消
               </Button>
               <Button
                 onClick={handleConfirmNickname}
                 className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
               >
                 确认打卡
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

       {/* 编辑昵称弹窗 */}
       <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
         <DialogContent className="max-w-sm rounded-2xl">
           <DialogHeader>
             <DialogTitle className="text-lg">修改昵称</DialogTitle>
             <DialogDescription className="text-sm text-muted-foreground">
               修改昵称后，将重新检查您的今日打卡状态
             </DialogDescription>
           </DialogHeader>

           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label htmlFor="edit-nickname" className="text-sm font-medium">
                 新的昵称
               </Label>
               <Input
                 id="edit-nickname"
                 placeholder="请输入新的昵称"
                 value={editNickname}
                 onChange={(e) => setEditNickname(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     handleConfirmEditNickname();
                   }
                 }}
                 className="h-12 rounded-xl"
                 autoFocus
               />
             </div>

             <div className="flex gap-3">
               <Button
                 variant="outline"
                 onClick={handleCancelEditNickname}
                 className="flex-1 h-12 rounded-xl"
               >
                 取消
               </Button>
               <Button
                 onClick={handleConfirmEditNickname}
                 className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
               >
                 确认修改
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
    </section>
  );
}
