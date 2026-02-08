import { useMemo } from 'react';
import { useBodyMetrics } from './useBodyMetrics';
import { useNutritionStore } from '../store/nutritionStore';
import { useAuthStore } from '../store/authStore';
import {
  calculateTDEE,
  calculateCalorieTarget,
  calculateMacros,
  calculateWeightTrend,
  calculateBMR,
  estimateTDEE,
} from '../utils/calculations';

export function useTDEECalculation() {
  const { profile } = useAuthStore();
  const { metrics } = useBodyMetrics();
  const { targets } = useNutritionStore();

  const weightTrend = useMemo(() => {
    if (metrics.length < 2) return null;
    return calculateWeightTrend(
      metrics.map((m) => ({ date: m.date, weight: m.weight }))
    );
  }, [metrics]);

  const estimatedTDEE = useMemo(() => {
    if (!profile) return null;

    // If we have enough data, calculate from actual intake + weight change
    // Note: targets.calories is a proxy for actual avg intake until we have daily logs history
    if (metrics.length >= 14 && targets) {
      const oldestWeight = metrics[metrics.length - 1].weight;
      const newestWeight = metrics[0].weight;
      const weightChange = newestWeight - oldestWeight;
      // Use target as approximation of avg intake (actual daily logs history not yet available here)
      return calculateTDEE(targets.calories, weightChange, metrics.length);
    }

    // Otherwise estimate from BMR
    if (profile.age && profile.height) {
      const bmr = calculateBMR(
        metrics[0]?.weight || 70,
        profile.height,
        profile.age,
        profile.gender || 'male'
      );
      return estimateTDEE(bmr, profile.activityLevel);
    }

    return null;
  }, [profile, metrics, targets]);

  const recommendedTargets = useMemo(() => {
    if (!estimatedTDEE || !profile) return null;
    const calorieTarget = calculateCalorieTarget(estimatedTDEE, profile.goal);
    const bodyWeight = metrics[0]?.weight || 70;
    const macros = calculateMacros(calorieTarget, bodyWeight, profile.goal);
    return {
      calories: calorieTarget,
      ...macros,
      calculatedTDEE: estimatedTDEE,
    };
  }, [estimatedTDEE, profile, metrics]);

  return {
    weightTrend,
    estimatedTDEE,
    recommendedTargets,
  };
}
