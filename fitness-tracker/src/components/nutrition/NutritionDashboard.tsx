import { useFoodLog } from '../../hooks/useFoodLog';
import { useNutritionStore } from '../../store/nutritionStore';
import { useAuthStore } from '../../store/authStore';
import { MacroDisplay } from './MacroDisplay';
import { MealCard } from './MealCard';
import { FoodLogger } from './FoodLogger';
import { QuickAddFood } from './QuickAddFood';
import { DatePicker } from '../shared/DatePicker';
import { logMeal, deleteMeal } from '../../services/nutrition.service';
import { useToastStore } from '../../store/toastStore';
import type { Food } from '../../types/nutrition.types';
import { MEAL_TYPES } from '../../utils/constants';

export function NutritionDashboard() {
  const { user } = useAuthStore();
  const { targets } = useNutritionStore();
  const { dailyNutrition, selectedDate, setSelectedDate } = useFoodLog();
  const { addToast } = useToastStore();

  const defaultTargets = targets || {
    calories: 2200,
    protein: 165,
    carbs: 220,
    fats: 73,
  };

  const currentTotals = dailyNutrition?.totals || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  };

  const handleQuickAdd = async (food: Food, servings: number, mealType: string) => {
    if (!user) return;
    try {
      await logMeal(user.uid, selectedDate, {
        foodId: food.id,
        food,
        servings,
        mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        timestamp: new Date(),
      });
      addToast({ type: 'success', message: `${food.name} logged` });
    } catch {
      addToast({ type: 'error', message: 'Failed to log meal' });
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;
    try {
      await deleteMeal(user.uid, selectedDate, mealId);
      addToast({ type: 'success', message: 'Meal removed' });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete meal' });
    }
  };

  const mealsByType = MEAL_TYPES.reduce(
    (acc, type) => {
      acc[type] = dailyNutrition?.meals.filter((m) => m.mealType === type) || [];
      return acc;
    },
    {} as Record<string, typeof dailyNutrition extends null ? never : NonNullable<typeof dailyNutrition>['meals']>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DatePicker value={selectedDate} onChange={setSelectedDate} />
        <div className="flex gap-2">
          <QuickAddFood onAdd={handleQuickAdd} />
          <FoodLogger date={selectedDate} />
        </div>
      </div>

      <MacroDisplay current={currentTotals} target={defaultTargets} />

      <div className="space-y-4">
        {MEAL_TYPES.map((type) => (
          <div key={type}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-300 capitalize">{type}</h3>
              <span className="text-xs text-gray-500">
                {mealsByType[type]?.reduce(
                  (sum, m) => sum + Math.round(m.food.macros.calories * m.servings),
                  0
                ) || 0}{' '}
                kcal
              </span>
            </div>
            {mealsByType[type]?.length > 0 ? (
              <div className="space-y-1">
                {mealsByType[type].map((meal) => (
                  <MealCard key={meal.id} meal={meal} onDelete={handleDeleteMeal} />
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-600 py-2 px-3 rounded-lg border border-dashed border-gray-800">
                No {type} logged
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
