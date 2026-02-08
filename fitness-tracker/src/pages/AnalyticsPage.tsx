import { Header } from '../components/layout/Header';
import { WeightChart } from '../components/analytics/WeightChart';
import { CalorieChart } from '../components/analytics/CalorieChart';
import { StrengthChart } from '../components/analytics/StrengthChart';
import { ProgressPhotos } from '../components/analytics/ProgressPhotos';
import { BodyMetricsLogger } from '../components/analytics/BodyMetricsLogger';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <Header title="Analytics" subtitle="Track your progress over time" />

      <BodyMetricsLogger />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeightChart />
        <CalorieChart />
      </div>

      <StrengthChart />

      <ProgressPhotos />
    </div>
  );
}
