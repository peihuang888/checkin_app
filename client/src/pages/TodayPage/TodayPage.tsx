import { useState, useEffect } from 'react';
import HeaderSection from './HeaderSection';
import CheckInButtonSection from './CheckInButtonSection';
import TodayListSection from './TodayListSection';
import ShareSection from './ShareSection';
import { getStoredOrganization } from '@/utils/organization';

export default function TodayPage() {
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    const loadOrgName = () => {
      const { name } = getStoredOrganization();
      setOrgName(name);
    };

    loadOrgName();

    window.addEventListener('organization-changed', loadOrgName);
    return () => window.removeEventListener('organization-changed', loadOrgName);
  }, []);

  return (
    <div className="w-full flex flex-col gap-4 py-4">
      {orgName && (
        <div className="text-center text-xs text-muted-foreground">
          当前组织：{orgName}
        </div>
      )}
      <HeaderSection />
      <CheckInButtonSection />
      <TodayListSection />
      <ShareSection />
    </div>
  );
}
