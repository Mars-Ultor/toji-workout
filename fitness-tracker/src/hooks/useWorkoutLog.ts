import { useEffect } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { subscribeToWorkoutHistory } from '../services/workout.service';
import { useAuthStore } from '../store/authStore';

export function useWorkoutLog() {
  const { user } = useAuthStore();
  const {
    activeWorkout,
    workoutHistory,
    setWorkoutHistory,
    startWorkout,
    endWorkout,
    addExercise,
    removeExercise,
    updateSet,
    addSet,
    removeSet,
  } = useWorkoutStore();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToWorkoutHistory(user.uid, 20, (workouts) => {
      setWorkoutHistory(workouts);
    });

    return unsubscribe;
  }, [user, setWorkoutHistory]);

  return {
    activeWorkout,
    workoutHistory,
    startWorkout,
    endWorkout,
    addExercise,
    removeExercise,
    updateSet,
    addSet,
    removeSet,
  };
}
