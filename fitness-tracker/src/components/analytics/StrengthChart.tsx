import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '../shared/Card';
import { useWorkoutStore } from '../../store/workoutStore';

export function StrengthChart() {
  const { workoutHistory } = useWorkoutStore();
  const workouts = workoutHistory;

  // Group by exercise name and track max weight over time
  const exerciseMap = new Map<string, { date: string; maxWeight: number }[]>();

  [...workouts].reverse().forEach((w) => {
    const date = new Date(w.date).toISOString().split('T')[0];

    w.exercises.forEach((ex) => {
      const maxWeight = Math.max(...ex.sets.map((s) => s.weight), 0);
      if (maxWeight <= 0) return;

      if (!exerciseMap.has(ex.exercise.name)) {
        exerciseMap.set(ex.exercise.name, []);
      }
      exerciseMap.get(ex.exercise.name)!.push({ date, maxWeight });
    });
  });

  // Take the top 3 exercises by frequency
  const topExercises = Array.from(exerciseMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  if (topExercises.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Strength Progress</h3>
        <div className="text-center py-8 text-gray-500 text-sm">
          Complete workouts with weights to track strength progress
        </div>
      </Card>
    );
  }

  // Merge into a unified dataset by date
  const allDates = new Set<string>();
  topExercises.forEach(([, data]) => data.forEach((d) => allDates.add(d.date)));
  const sortedDates = Array.from(allDates).sort();

  const chartData = sortedDates.map((date) => {
    const entry: Record<string, string | number> = { date };
    topExercises.forEach(([name, data]) => {
      const point = data.find((d) => d.date === date);
      if (point) entry[name] = point.maxWeight;
    });
    return entry;
  });

  const colors = ['#ef4444', '#3b82f6', '#22c55e'];

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Strength Progress</h3>
      <ResponsiveContainer width="100%" height={220}>
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
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} width={40} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f3f4f6',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
          />
          {topExercises.map(([name], i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={colors[i]}
              strokeWidth={2}
              dot={{ fill: colors[i], r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
