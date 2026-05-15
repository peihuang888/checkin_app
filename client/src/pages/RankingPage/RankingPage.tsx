import RankingHeaderSection from './RankingHeaderSection';
import TrendChartSection from './TrendChartSection';
import RankingListSection from './RankingListSection';

const RankingPage = () => {
  return (
    <div className="w-full space-y-5 pt-4">
      <RankingHeaderSection />
      <TrendChartSection />
      <RankingListSection />
    </div>
  );
};

export default RankingPage;
