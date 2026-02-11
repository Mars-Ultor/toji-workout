import { create } from 'zustand';
import type { Workout, WorkoutExercise, Exercise } from '../types/workout.types';

interface WorkoutState {
  // Active workout
  activeWorkout: {
    name: string;
    exercises: WorkoutExercise[];
    startTime: Date | null;
  } | null;
  // History
  workoutHistory: Workout[];
  // Exercise library
  exercises: Exercise[];

  // Actions
  startWorkout: (name: string) => void;
  endWorkout: () => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (index: number) => void;
  updateSet: (
    exerciseIndex: number,
    setIndex: number,
    data: Partial<{ weight: number; reps: number; rir: number; rpe: number; completed: boolean; duration: number; restSeconds: number }>
  ) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  setWorkoutHistory: (workouts: Workout[]) => void;
  setExercises: (exercises: Exercise[]) => void;
  moveExercise: (from: number, to: number) => void;
  updateExerciseNotes: (exerciseIndex: number, notes: string) => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  activeWorkout: null,
  workoutHistory: [],
  exercises: [],

  startWorkout: (name) =>
    set({
      activeWorkout: {
        name,
        exercises: [],
        startTime: new Date(),
      },
    }),

  endWorkout: () => set({ activeWorkout: null }),

  addExercise: (exercise) =>
    set((state) => {
      if (!state.activeWorkout) return {};
      
      // Determine default rest time based on exercise category
      const defaultRest = exercise.category === 'compound' ? 120 : 
                         exercise.category === 'isolation' ? 90 : 0;
      
      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: [
            ...state.activeWorkout.exercises,
            {
              exerciseId: exercise.id,
              exercise,
              sets: [
                { 
                  setNumber: 1, 
                  weight: 0, 
                  reps: 0, 
                  completed: false,
                  restSeconds: defaultRest,
                  duration: exercise.isTimed ? exercise.duration : undefined,
                },
              ],
            },
          ],
        },
      };
    }),

  removeExercise: (index) =>
    set((state) => {
      if (!state.activeWorkout) return {};
      const exercises = state.activeWorkout.exercises.filter((_, i) => i !== index);
      return {
        activeWorkout: { ...state.activeWorkout, exercises },
      };
    }),

  updateSet: (exerciseIndex, setIndex, data) =>
    set((state) => {
      if (!state.activeWorkout) return {};
      const exercises = [...state.activeWorkout.exercises];
      const sets = [...exercises[exerciseIndex].sets];
      sets[setIndex] = { ...sets[setIndex], ...data };
      exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets };
      return {
        activeWorkout: { ...state.activeWorkout, exercises },
      };
    }),

  addSet: (exerciseIndex) =>
    set((state) => {
      if (!state.activeWorkout) return {};
      const exercises = [...state.activeWorkout.exercises];
      const currentSets = exercises[exerciseIndex].sets;
      const lastSet = currentSets[currentSets.length - 1];
      const exercise = exercises[exerciseIndex].exercise;
      
      exercises[exerciseIndex] = {
        ...exercises[exerciseIndex],
        sets: [
          ...currentSets,
          {
            setNumber: currentSets.length + 1,
            weight: lastSet?.weight || 0,
            reps: lastSet?.reps || 0,
            completed: false,
            restSeconds: lastSet?.restSeconds || (exercise.category === 'compound' ? 120 : 90),
            duration: exercise.isTimed ? exercise.duration : undefined,
          },
        ],
      };
      return {
        activeWorkout: { ...state.activeWorkout, exercises },
      };
    }),

  removeSet: (exerciseIndex, setIndex) =>
    set((state) => {
      if (!state.activeWorkout) return {};
      const exercises = [...state.activeWorkout.exercises];
      exercises[exerciseIndex] = {
        ...exercises[exerciseIndex],
        sets: exercises[exerciseIndex].sets
          .filter((_, i) => i !== setIndex)
          .map((s, i) => ({ ...s, setNumber: i + 1 })),
      };
      return {
        activeWorkout: { ...state.activeWorkout, exercises },
      };
    }),

  setWorkoutHistory: (workouts) => set({ workoutHistory: workouts }),
  setExercises: (exercises) => set({ exercises }),

  moveExercise: (from, to) =>
    set((state) => {
      if (!state.activeWorkout) return {};
      const exercises = [...state.activeWorkout.exercises];
      const [moved] = exercises.splice(from, 1);
      exercises.splice(to, 0, moved);
      return { activeWorkout: { ...state.activeWorkout, exercises } };
    }),

  updateExerciseNotes: (exerciseIndex, notes) =>
    set((state) => {
      if (!state.activeWorkout) return {};
      const exercises = [...state.activeWorkout.exercises];
      exercises[exerciseIndex] = { ...exercises[exerciseIndex], notes };
      return { activeWorkout: { ...state.activeWorkout, exercises } };
    }),
}));
