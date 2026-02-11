import type { SavedProgram, SavedProgramExercise } from './program.service';
import { getPrograms, saveProgram } from './program.service';

/**
 * Updates existing programs to include new features:
 * - Timer support for timed exercises
 * - Auto-progression settings
 * - Progression schemes
 */
export async function updateProgramsWithNewFeatures(userId: string): Promise<void> {
  const programs = await getPrograms(userId);
  
  for (const program of programs) {
    let updated = false;
    
    const updatedDays = program.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => {
        const updatedExercise = updateExerciseWithFeatures(exercise);
        if (updatedExercise !== exercise) {
          updated = true;
        }
        return updatedExercise;
      }),
    }));
    
    if (updated) {
      const updatedProgram: SavedProgram = {
        ...program,
        days: updatedDays,
      };
      await saveProgram(userId, updatedProgram);
    }
  }
}

/**
 * Updates a single exercise with new features based on its category
 */
function updateExerciseWithFeatures(exercise: SavedProgramExercise): SavedProgramExercise {
  const updated = { ...exercise };
  
  // Add isTimed flag for exercises that should be timed
  if (!updated.isTimed && shouldBeTimedExercise(exercise)) {
    updated.isTimed = true;
    if (!updated.duration) {
      updated.duration = getDefaultDuration(exercise);
    }
  }
  
  // Enable auto-progression by default for main exercises
  if (updated.autoProgressionEnabled === undefined) {
    updated.autoProgressionEnabled = shouldEnableAutoProgression(exercise);
  }
  
  // Set default progression scheme based on exercise category
  if (!updated.progressionScheme && updated.autoProgressionEnabled) {
    updated.progressionScheme = getDefaultProgressionScheme(exercise);
  }
  
  // Ensure rest times are set appropriately
  if (!updated.restSeconds || updated.restSeconds === 0) {
    updated.restSeconds = getDefaultRestTime(exercise);
  }
  
  return updated;
}

/**
 * Determines if an exercise should be timed (e.g., planks, holds)
 */
function shouldBeTimedExercise(exercise: SavedProgramExercise): boolean {
  const timedExerciseNames = [
    'plank', 'side plank', 'hollow hold', 'dead bug', 'wall sit',
    'l-sit', 'front lever', 'back lever', 'handstand hold'
  ];
  
  const exerciseNameLower = exercise.exerciseName.toLowerCase();
  
  // Check if it's a warmup or stretch (typically timed)
  if (exercise.category === 'warmup' || exercise.category === 'stretch') {
    return true;
  }
  
  // Check if exercise name contains keywords for timed exercises
  return timedExerciseNames.some(name => exerciseNameLower.includes(name));
}

/**
 * Gets default duration for timed exercises
 */
function getDefaultDuration(exercise: SavedProgramExercise): number {
  if (exercise.category === 'warmup') return 30;
  if (exercise.category === 'stretch') return 30;
  
  // For isometric holds, use 30-60 seconds depending on difficulty
  const exerciseNameLower = exercise.exerciseName.toLowerCase();
  if (exerciseNameLower.includes('plank')) return 45;
  if (exerciseNameLower.includes('hold')) return 30;
  
  return 30;
}

/**
 * Determines if auto-progression should be enabled for an exercise
 */
function shouldEnableAutoProgression(exercise: SavedProgramExercise): boolean {
  // Don't auto-progress warmups and stretches
  if (exercise.category === 'warmup' || exercise.category === 'stretch') {
    return false;
  }
  
  // Enable for all main exercises (compound and isolation)
  return exercise.category === 'compound' || exercise.category === 'isolation';
}

/**
 * Gets the default progression scheme based on exercise category
 */
function getDefaultProgressionScheme(exercise: SavedProgramExercise): 'linear' | 'double-progression' | 'wave' {
  if (exercise.category === 'compound') {
    // Compound exercises use linear progression (add weight when hitting rep targets)
    return 'linear';
  }
  
  if (exercise.category === 'isolation') {
    // Isolation exercises use double progression (increase reps, then weight)
    return 'double-progression';
  }
  
  // Default to linear
  return 'linear';
}

/**
 * Gets appropriate rest time based on exercise category and sets/reps
 */
function getDefaultRestTime(exercise: SavedProgramExercise): number {
  if (exercise.category === 'warmup' || exercise.category === 'stretch') {
    return 0; // No rest needed for warmups/stretches
  }
  
  if (exercise.category === 'compound') {
    // Compound exercises need more rest
    if (exercise.repsMax <= 5) {
      return 180; // Heavy strength work: 3 minutes
    } else if (exercise.repsMax <= 8) {
      return 150; // Moderate-heavy: 2.5 minutes
    } else {
      return 120; // Hypertrophy: 2 minutes
    }
  }
  
  if (exercise.category === 'isolation') {
    // Isolation exercises need less rest
    if (exercise.repsMax <= 8) {
      return 90; // Lower reps: 90 seconds
    } else {
      return 60; // Higher reps: 60 seconds
    }
  }
  
  // Default
  return 90;
}

/**
 * Applies progression scheme to update exercise targets based on performance
 */
export function applyProgressionToExercise(
  exercise: SavedProgramExercise,
  performance: {
    avgWeight: number;
    avgReps: number;
    avgRir: number;
    completionRate: number; // percentage of sets completed
  }
): SavedProgramExercise {
  if (!exercise.autoProgressionEnabled || !exercise.progressionScheme) {
    return exercise;
  }
  
  const { avgReps, avgRir, completionRate } = performance;
  const updated = { ...exercise };
  
  // Check if performance warrants progression
  const hitTopOfRange = avgReps >= exercise.repsMax;
  const hasRirLeft = avgRir >= 2;
  const goodCompletion = completionRate >= 0.8;
  
  if (!goodCompletion) {
    // Poor completion - don't progress or even deload
    if (completionRate < 0.5) {
      // Significant struggle - recommend deload
      updated.repsMin = Math.max(exercise.repsMin - 2, 5);
      updated.repsMax = Math.max(exercise.repsMax - 2, 8);
    }
    return updated;
  }
  
  switch (exercise.progressionScheme) {
    case 'linear':
      if (hitTopOfRange && hasRirLeft) {
        // Weight increase happens in the workout logger based on progression suggestions
        // This is mainly informational for the user
      }
      break;
      
    case 'double-progression':
      if (hitTopOfRange && hasRirLeft) {
        // Don't change rep range, signal that weight should increase
        // The actual weight change happens in the workout logger
      }
      break;
      
    case 'wave':
      // Wave progression is time-based, handled in the progression service
      break;
  }
  
  return updated;
}
