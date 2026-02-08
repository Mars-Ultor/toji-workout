/**
 * Calculate TDEE based on weight trend and calorie intake.
 * Uses the energy balance equation.
 */
export function calculateTDEE(
  avgCaloriesPerDay: number,
  weightChange: number, // in kg
  days: number
): number {
  // 1 kg of fat ≈ 7700 calories
  const caloriesFromWeightChange = (weightChange * 7700) / days;
  return Math.round(avgCaloriesPerDay + caloriesFromWeightChange);
}

/**
 * Calculate recommended calorie target based on goal.
 */
export function calculateCalorieTarget(
  tdee: number,
  goal: 'cut' | 'maintain' | 'bulk'
): number {
  switch (goal) {
    case 'cut':
      return Math.round(tdee * 0.8); // 20% deficit
    case 'bulk':
      return Math.round(tdee * 1.1); // 10% surplus
    case 'maintain':
    default:
      return Math.round(tdee);
  }
}

/**
 * Calculate recommended macro split.
 */
export function calculateMacros(
  calories: number,
  bodyWeight: number, // in kg
  goal: 'cut' | 'maintain' | 'bulk'
): { protein: number; carbs: number; fats: number } {
  // Protein: 2.2g per kg body weight
  const protein = Math.round(bodyWeight * 2.2);

  // Fats: 25-30% of calories
  const fatPercentage = goal === 'cut' ? 0.25 : 0.3;
  const fats = Math.round((calories * fatPercentage) / 9);

  // Carbs: remaining calories
  const remainingCalories = calories - protein * 4 - fats * 9;
  const carbs = Math.max(0, Math.round(remainingCalories / 4));

  return { protein, carbs, fats };
}

/**
 * Calculate weight trend using exponential smoothing.
 */
export function calculateWeightTrend(
  weights: { date: string; weight: number }[],
  smoothingFactor: number = 0.3
): number {
  if (weights.length === 0) return 0;

  let trend = weights[0].weight;
  for (let i = 1; i < weights.length; i++) {
    trend = smoothingFactor * weights[i].weight + (1 - smoothingFactor) * trend;
  }

  return Number(trend.toFixed(1));
}

/**
 * Progressive overload calculation.
 */
export function calculateProgression(
  currentWeight: number,
  targetReps: number,
  actualReps: number,
  rir: number
): { newWeight: number; newReps: number; recommendation: string } {
  // If completed all reps with 2+ RIR, increase weight
  if (actualReps >= targetReps && rir >= 2) {
    return {
      newWeight: Number((currentWeight * 1.025).toFixed(1)),
      newReps: targetReps,
      recommendation: 'Increase weight by 2.5%',
    };
  }

  // If barely completed with 0-1 RIR, maintain
  if (actualReps >= targetReps && rir < 2) {
    return {
      newWeight: currentWeight,
      newReps: targetReps,
      recommendation: 'Maintain current weight',
    };
  }

  // If failed to complete, reduce weight or reps
  return {
    newWeight: Number((currentWeight * 0.95).toFixed(1)),
    newReps: targetReps,
    recommendation: 'Reduce weight by 5% or target fewer reps',
  };
}

/**
 * Calculate training volume (sets × reps × weight).
 */
export function calculateVolume(
  sets: { weight: number; reps: number }[]
): number {
  return sets.reduce((total, set) => total + set.weight * set.reps, 0);
}

/**
 * Calculate BMR using Mifflin-St Jeor equation.
 */
export function calculateBMR(
  weight: number, // kg
  height: number, // cm
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'male') return Math.round(base + 5);
  if (gender === 'female') return Math.round(base - 161);
  // For 'other', average of male and female formulas
  return Math.round(base + (5 + -161) / 2);
}

/**
 * Calculate estimated TDEE from BMR and activity level.
 */
export function estimateTDEE(
  bmr: number,
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very' | 'extra'
): number {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
    extra: 1.9,
  };
  return Math.round(bmr * multipliers[activityLevel]);
}
