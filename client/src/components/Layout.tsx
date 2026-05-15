import { useEffect, useState, useCallback } from 'react';
import { ActiveLink } from '@lark-apaas/client-toolkit/components/ActiveLink';
import { Outlet, useLocation } from 'react-router-dom';
import { HomeIcon, TrophyIcon, HistoryIcon, Building2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getOrganizations } from '@/api';
import { logger } from '@lark-apaas/client-toolkit/logger';

const STORAGE_KEY_CODE = '__global_organization_code';
const STORAGE_KEY_NAME = '__global_organization_name';

const navItems = [
  { path: '/', label: '今日打卡', icon: HomeIcon },
  { path: '/ranking', label: '排行榜', icon: TrophyIcon },
  { path: '/history', label: '历史记录', icon: HistoryIcon },
];

interface IOrganization {
  code: string;
  name: string;
}

const Layout = () => {
  const { pathname } = useLocation();
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<IOrganization | null>(null);
  const [loading, setLoading] = useState(false);

  // 路由切换时滚动到页面顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // 初始化：检查是否已选择组织
  useEffect(() => {
    const code = localStorage.getItem(STORAGE_KEY_CODE);
    const name = localStorage.getItem(STORAGE_KEY_NAME);
    if (code && name) {
      setSelectedOrg({ code, name });
    } else {
      setOrgDialogOpen(true);
      loadOrganizations();
    }
  }, []);

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const orgs = await getOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      logger.error('加载组织列表失败', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectOrg = useCallback((org: IOrganization) => {
    localStorage.setItem(STORAGE_KEY_CODE, org.code);
    localStorage.setItem(STORAGE_KEY_NAME, org.name);
    setSelectedOrg(org);
    setOrgDialogOpen(false);
    // 触发组织切换事件，通知其他组件更新
    window.dispatchEvent(new Event('organization-changed'));
  }, []);

  const handleChangeOrg = useCallback(() => {
    setOrgDialogOpen(true);
    loadOrganizations();
  }, [loadOrganizations]);

  return (
    <div className="min-h-screen bg-background">
      {/* 组织选择栏 */}
      {selectedOrg && (
        <div className="max-w-md mx-auto px-4 pt-3">
          <button
            type="button"
            onClick={handleChangeOrg}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-foreground hover:bg-accent transition-colors"
          >
            <Building2Icon className="size-4 text-primary" />
            <span className="font-medium">{selectedOrg.name}</span>
          </button>
        </div>
      )}

      {/* 页面主内容 */}
      <main className="max-w-md mx-auto px-4 pb-24">
        <Outlet />
      </main>

      {/* 底部固定导航 */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-t border-border rounded-t-2xl shadow-[0_-2px_10px_rgba(0_0_0_0.05)]">
        <div className="max-w-md mx-auto h-full flex items-center justify-around">
          {navItems.map((item) => (
            <ActiveLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-colors duration-200 ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`size-5 transition-colors duration-200 ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <span className="text-xs font-medium">{item.label}</span>
                </>
              )}
            </ActiveLink>
          ))}
        </div>
      </nav>

      {/* 组织选择弹窗 */}
      <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Building2Icon className="size-5 text-primary" />
              选择组织
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                加载中...
              </div>
            ) : organizations.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                暂无可用组织
              </div>
            ) : (
              organizations.map((org) => (
                <Button
                  key={org.code}
                  variant="outline"
                  onClick={() => handleSelectOrg(org)}
                  className="w-full h-14 rounded-xl justify-start text-left font-medium"
                >
                  <Building2Icon className="size-4 mr-2 text-primary shrink-0" />
                  {org.name}
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Layout;
