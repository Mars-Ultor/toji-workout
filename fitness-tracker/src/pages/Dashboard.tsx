import { Header } from '../components/layout/Header';
import { Card } from '../components/shared/Card';
import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useNutritionStore } from '../store/nutritionStore';
import { useBodyMetrics } from '../hooks/useBodyMetrics';
import { Dumbbell, Utensils, TrendingUp, Flame, Target, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile } = useAuthStore();
  const { workoutHistory } = useWorkoutStore();
  const { dailyNutrition, targets } = useNutritionStore();
  const { latestWeight } = useBodyMetrics();

  const currentCals = dailyNutrition?.totals?.calories || 0;
  const targetCals = targets?.calories || 2200;
  const recentWorkouts = workoutHistory.slice(0, 3);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      <Header
        title={`${greeting()}, ${profile?.name?.split(' ')[0] || 'there'}!`}
        subtitle="Here's your fitness overview"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Flame className="text-red-500" size={20} />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{Math.round(currentCals)}</div>
              <div className="text-[11px] text-gray-500">/ {targetCals} kcal</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Dumbbell className="text-blue-500" size={20} />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{workoutHistory.length}</div>
              <div className="text-[11px] text-gray-500">Workouts</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div>
              <div className="text-lg font-bold text-white">
                {latestWeight ? `${latestWeight}` : '--'}
              </div>
              <div className="text-[11px] text-gray-500">
                {latestWeight ? profile?.preferences.weightUnit || 'lbs' : 'No weight'}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Target className="text-yellow-500" size={20} />
            </div>
            <div>
              <div className="text-lg font-bold text-white capitalize">
                {profile?.goal || 'Set goal'}
              </div>
              <div className="text-[11px] text-gray-500">Current Goal</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Macros Summary */}
      {dailyNutrition && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-200 flex items-center gap-2">
              <Utensils size={16} /> Today's Nutrition
            </h3>
            <Link to="/nutrition" className="text-xs text-red-400 hover:text-red-300">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">
                {Math.round(dailyNutrition.totals.calories)}
              </div>
              <div className="text-[11px] text-gray-500">Calories</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">
                {Math.round(dailyNutrition.totals.protein)}g
              </div>
              <div className="text-[11px] text-gray-500">Protein</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">
                {Math.round(dailyNutrition.totals.carbs)}g
              </div>
              <div className="text-[11px] text-gray-500">Carbs</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">
                {Math.round(dailyNutrition.totals.fats)}g
              </div>
              <div className="text-[11px] text-gray-500">Fats</div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Workouts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-200 flex items-center gap-2">
            <Dumbbell size={16} /> Recent Workouts
          </h3>
          <Link to="/workout" className="text-xs text-red-400 hover:text-red-300">
            View All →
          </Link>
        </div>

        {recentWorkouts.length > 0 ? (
          <div className="space-y-2">
            {recentWorkouts.map((w) => {
              const date = new Date(w.date);
              return (
                <Card key={w.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-200">{w.name}</div>
                    <div className="text-xs text-gray-500">
                      {w.exercises.length} exercises · {date.toLocaleDateString()}
                    </div>
                  </div>
                  <Award size={16} className="text-gray-700" />
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-6">
            <p className="text-gray-500 text-sm">No workouts yet. Start training!</p>
            <Link
              to="/workout"
              className="inline-block mt-2 text-sm text-red-400 hover:text-red-300"
            >
              Go to Workout →
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
