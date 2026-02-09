import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../shared/Card';
import { useBodyMetrics } from '../../hooks/useBodyMetrics';
import { useAuthStore } from '../../store/authStore';

export function WeightChart() {
  const { metrics } = useBodyMetrics();
  const { profile } = useAuthStore();
  const data = metrics || [];

  const chartData = [...data]
    .reverse()
    .map((m) => ({
      date: m.date,
      weight: m.weight,
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Weight Trend</h3>
        <div className="text-center py-8 text-gray-500 text-sm">
          Log your weight to see trends
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Weight Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={(val) => {
              const d = new Date(val);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f3f4f6',
              fontSize: '12px',
            }}
            formatter={(value) => [`${value} ${profile?.preferences.weightUnit || 'lbs'}`, 'Weight']}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
