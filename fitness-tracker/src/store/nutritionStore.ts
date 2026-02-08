import { create } from 'zustand';
import type { DailyNutrition, NutritionTargets, MealEntry, Food } from '../types/nutrition.types';

interface NutritionState {
  dailyNutrition: DailyNutrition | null;
  targets: NutritionTargets | null;
  recentFoods: Food[];
  selectedDate: string;
  setDailyNutrition: (data: DailyNutrition | null) => void;
  setTargets: (targets: NutritionTargets | null) => void;
  setRecentFoods: (foods: Food[]) => void;
  setSelectedDate: (date: string) => void;
  addMeal: (meal: MealEntry) => void;
  removeMeal: (mealId: string) => void;
}

export const useNutritionStore = create<NutritionState>((set) => ({
  dailyNutrition: null,
  targets: null,
  recentFoods: [],
  selectedDate: new Date().toISOString().split('T')[0],

  setDailyNutrition: (data) => set({ dailyNutrition: data }),
  setTargets: (targets) => set({ targets }),
  setRecentFoods: (foods) => set({ recentFoods: foods }),
  setSelectedDate: (date) => set({ selectedDate: date }),

  addMeal: (meal) =>
    set((state) => {
      const current = state.dailyNutrition;
      if (!current) {
        return {
          dailyNutrition: {
            date: state.selectedDate,
            meals: [meal],
            totals: {
              calories: meal.food.macros.calories * meal.servings,
              protein: meal.food.macros.protein * meal.servings,
              carbs: meal.food.macros.carbs * meal.servings,
              fats: meal.food.macros.fats * meal.servings,
            },
          },
        };
      }
      const meals = [...current.meals, meal];
      const totals = meals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.food.macros.calories * m.servings,
          protein: acc.protein + m.food.macros.protein * m.servings,
          carbs: acc.carbs + m.food.macros.carbs * m.servings,
          fats: acc.fats + m.food.macros.fats * m.servings,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );
      return { dailyNutrition: { ...current, meals, totals } };
    }),

  removeMeal: (mealId) =>
    set((state) => {
      const current = state.dailyNutrition;
      if (!current) return {};
      const meals = current.meals.filter((m) => m.id !== mealId);
      const totals = meals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.food.macros.calories * m.servings,
          protein: acc.protein + m.food.macros.protein * m.servings,
          carbs: acc.carbs + m.food.macros.carbs * m.servings,
          fats: acc.fats + m.food.macros.fats * m.servings,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );
      return { dailyNutrition: { ...current, meals, totals } };
    }),
}));
