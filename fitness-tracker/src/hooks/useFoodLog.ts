import { useEffect } from 'react';
import { useNutritionStore } from '../store/nutritionStore';
import { subscribeToDailyNutrition } from '../services/nutrition.service';
import { useAuthStore } from '../store/authStore';

export function useFoodLog(date?: string) {
  const { user } = useAuthStore();
  const {
    dailyNutrition,
    selectedDate,
    setDailyNutrition,
    setSelectedDate,
    targets,
  } = useNutritionStore();

  const activeDate = date || selectedDate;

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToDailyNutrition(user.uid, activeDate, (data) => {
      setDailyNutrition(data);
    });

    return unsubscribe;
  }, [user, activeDate, setDailyNutrition]);

  return {
    dailyNutrition,
    targets,
    selectedDate: activeDate,
    setSelectedDate,
  };
}
