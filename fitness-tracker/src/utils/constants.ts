export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Full Body',
] as const;

export const EQUIPMENT = [
  'Barbell',
  'Dumbbell',
  'Bodyweight',
  'Cable',
  'Machine',
  'Kettlebell',
  'Resistance Band',
  'EZ Bar',
  'Smith Machine',
  'Trap Bar',
  'Medicine Ball',
  'Stability Ball',
  'Suspension',
  'Ab Wheel',
  'Battle Rope',
  'Sled',
  'Bosu Ball',
  'None',
] as const;

export const DEFAULT_REST_SECONDS = 90;

export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (office job, little exercise)' },
  { value: 'light', label: 'Light (exercise 1-3 days/week)' },
  { value: 'moderate', label: 'Moderate (exercise 3-5 days/week)' },
  { value: 'very', label: 'Very Active (exercise 6-7 days/week)' },
  { value: 'extra', label: 'Extra Active (athlete / physical job)' },
] as const;

export const GOALS = [
  { value: 'cut', label: 'Lose Fat', description: '20% calorie deficit' },
  { value: 'maintain', label: 'Maintain', description: 'Eat at maintenance' },
  { value: 'bulk', label: 'Build Muscle', description: '10% calorie surplus' },
] as const;

export const DEFAULT_EXERCISES = [
  { name: 'Push-ups', category: 'compound' as const, muscleGroup: ['Chest', 'Triceps', 'Shoulders'], equipment: ['Bodyweight'], difficulty: 'beginner' as const },
  { name: 'Pull-ups', category: 'compound' as const, muscleGroup: ['Back', 'Biceps'], equipment: ['Bodyweight'], difficulty: 'intermediate' as const },
  { name: 'Squats', category: 'compound' as const, muscleGroup: ['Quads', 'Glutes', 'Hamstrings'], equipment: ['Bodyweight'], difficulty: 'beginner' as const },
  { name: 'Lunges', category: 'compound' as const, muscleGroup: ['Quads', 'Glutes', 'Hamstrings'], equipment: ['Bodyweight'], difficulty: 'beginner' as const },
  { name: 'Plank', category: 'isolation' as const, muscleGroup: ['Core'], equipment: ['Bodyweight'], difficulty: 'beginner' as const },
  { name: 'Burpees', category: 'compound' as const, muscleGroup: ['Full Body'], equipment: ['Bodyweight'], difficulty: 'intermediate' as const },
  { name: 'Dips', category: 'compound' as const, muscleGroup: ['Chest', 'Triceps'], equipment: ['Bodyweight'], difficulty: 'intermediate' as const },
  { name: 'Mountain Climbers', category: 'cardio' as const, muscleGroup: ['Core', 'Full Body'], equipment: ['Bodyweight'], difficulty: 'beginner' as const },
  { name: 'Pike Push-ups', category: 'compound' as const, muscleGroup: ['Shoulders', 'Triceps'], equipment: ['Bodyweight'], difficulty: 'intermediate' as const },
  { name: 'Pistol Squats', category: 'compound' as const, muscleGroup: ['Quads', 'Glutes'], equipment: ['Bodyweight'], difficulty: 'advanced' as const },
  { name: 'Muscle-ups', category: 'compound' as const, muscleGroup: ['Back', 'Chest', 'Shoulders'], equipment: ['Bodyweight'], difficulty: 'advanced' as const },
  { name: 'Handstand Push-ups', category: 'compound' as const, muscleGroup: ['Shoulders', 'Triceps'], equipment: ['Bodyweight'], difficulty: 'advanced' as const },
  { name: 'Bench Press', category: 'compound' as const, muscleGroup: ['Chest', 'Triceps', 'Shoulders'], equipment: ['Barbell'], difficulty: 'intermediate' as const },
  { name: 'Deadlift', category: 'compound' as const, muscleGroup: ['Back', 'Hamstrings', 'Glutes'], equipment: ['Barbell'], difficulty: 'intermediate' as const },
  { name: 'Overhead Press', category: 'compound' as const, muscleGroup: ['Shoulders', 'Triceps'], equipment: ['Barbell'], difficulty: 'intermediate' as const },
  { name: 'Barbell Row', category: 'compound' as const, muscleGroup: ['Back', 'Biceps'], equipment: ['Barbell'], difficulty: 'intermediate' as const },
  { name: 'Barbell Squat', category: 'compound' as const, muscleGroup: ['Quads', 'Glutes', 'Hamstrings'], equipment: ['Barbell'], difficulty: 'intermediate' as const },
  { name: 'Bicep Curl', category: 'isolation' as const, muscleGroup: ['Biceps'], equipment: ['Dumbbell'], difficulty: 'beginner' as const },
  { name: 'Lateral Raise', category: 'isolation' as const, muscleGroup: ['Shoulders'], equipment: ['Dumbbell'], difficulty: 'beginner' as const },
  { name: 'Tricep Extension', category: 'isolation' as const, muscleGroup: ['Triceps'], equipment: ['Dumbbell'], difficulty: 'beginner' as const },
] as const;
