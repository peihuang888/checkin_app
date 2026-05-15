import DateFilterSection from './DateFilterSection';
import HistoryListSection from './HistoryListSection';

export default function HistoryPage() {
  return (
    <div className="w-full space-y-4 pt-4">
      <DateFilterSection />
      <HistoryListSection />
    </div>
  );
}
