import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card } from '../shared/Card';
import { useNutritionStore } from '../../store/nutritionStore';
import { useAuthStore } from '../../store/authStore';
import { getDailyNutrition } from '../../services/nutrition.service';

export function CalorieChart() {
  const { targets } = useNutritionStore();
  const { user } = useAuthStore();
  const target = targets?.calories || 2000;
  const [data, setData] = useState<{ date: string; calories: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchWeekData = async () => {
      const days: { date: string; calories: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        try {
          const nutrition = await getDailyNutrition(user.uid, dateStr);
          days.push({
            date: dateStr,
            calories: nutrition?.totals.calories || 0,
          });
        } catch {
          days.push({ date: dateStr, calories: 0 });
        }
      }
      setData(days);
    };
    fetchWeekData();
  }, [user]);

  const hasData = data.some((d) => d.calories > 0);

  if (!hasData) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Calorie Intake</h3>
        <div className="text-center py-8 text-gray-500 text-sm">
          Log your meals to see calorie trends
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Calorie Intake</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
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
            formatter={(value) => [`${value} kcal`, 'Calories']}
          />
          <ReferenceLine
            y={target}
            stroke="#22c55e"
            strokeDasharray="5 5"
            label={{ value: 'Target', fill: '#22c55e', fontSize: 10 }}
          />
          <Bar
            dataKey="calories"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
