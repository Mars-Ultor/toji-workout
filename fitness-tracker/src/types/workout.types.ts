export interface Exercise {
  id: string;
  name: string;
  category: 'compound' | 'isolation' | 'cardio';
  muscleGroup: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
  secondaryMuscles?: string[];
}

export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number; // Reps in reserve
  rpe?: number; // Rate of perceived exertion
  completed: boolean;
  restSeconds?: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  userId: string;
  date: string; // ISO date string (Firestore Timestamp serialized)
  name: string;
  exercises: WorkoutExercise[];
  duration?: number;
  notes?: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  weeks: ProgramWeek[];
}

export interface ProgramWeek {
  weekNumber: number;
  days: ProgramDay[];
}

export interface ProgramDay {
  dayNumber: number;
  name: string;
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  exerciseId: string;
  sets: number;
  reps: string; // e.g., "8-12"
  restSeconds: number;
}
