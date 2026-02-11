import type { Exercise } from '../types/workout.types';
import type { ExerciseHistory, AdaptationRecommendation } from './progression.service';

/**
 * Bodyweight exercise progression paths
 * Maps exercise IDs to their progressions
 */
export const BODYWEIGHT_PROGRESSIONS: Record<string, {
  easier?: { id: string; name: string };
  harder?: { id: string; name: string };
  alternatives?: Array<{ id: string; name: string }>;
}> = {
  // Push-up progressions
  'push-ups': {
    easier: { id: 'incline-push-ups', name: 'Incline Push-ups' },
    harder: { id: 'diamond-push-ups', name: 'Diamond Push-ups' },
    alternatives: [
      { id: 'wide-push-ups', name: 'Wide Push-ups' },
      { id: 'decline-push-ups', name: 'Decline Push-ups' },
    ],
  },
  'incline-push-ups': {
    harder: { id: 'push-ups', name: 'Push-ups' },
    alternatives: [
      { id: 'wall-push-ups', name: 'Wall Push-ups' },
      { id: 'knee-push-ups', name: 'Knee Push-ups' },
    ],
  },
  'diamond-push-ups': {
    easier: { id: 'push-ups', name: 'Push-ups' },
    harder: { id: 'one-arm-push-ups', name: 'One-Arm Push-ups' },
  },
  'one-arm-push-ups': {
    easier: { id: 'diamond-push-ups', name: 'Diamond Push-ups' },
    alternatives: [
      { id: 'archer-push-ups', name: 'Archer Push-ups' },
      { id: 'pseudo-planche-push-ups', name: 'Pseudo Planche Push-ups' },
    ],
  },

  // Pull-up progressions
  'pull-ups': {
    easier: { id: 'assisted-pull-ups', name: 'Assisted Pull-ups' },
    harder: { id: 'weighted-pull-ups', name: 'Weighted Pull-ups' },
    alternatives: [
      { id: 'chin-ups', name: 'Chin-ups' },
      { id: 'neutral-grip-pull-ups', name: 'Neutral Grip Pull-ups' },
    ],
  },
  'assisted-pull-ups': {
    easier: { id: 'negative-pull-ups', name: 'Negative Pull-ups' },
    harder: { id: 'pull-ups', name: 'Pull-ups' },
  },
  'negative-pull-ups': {
    easier: { id: 'inverted-rows', name: 'Inverted Rows' },
    harder: { id: 'assisted-pull-ups', name: 'Assisted Pull-ups' },
  },

  // Dip progressions
  'dips': {
    easier: { id: 'bench-dips', name: 'Bench Dips' },
    harder: { id: 'weighted-dips', name: 'Weighted Dips' },
    alternatives: [
      { id: 'ring-dips', name: 'Ring Dips' },
      { id: 'korean-dips', name: 'Korean Dips' },
    ],
  },
  'bench-dips': {
    easier: { id: 'assisted-dips', name: 'Assisted Dips' },
    harder: { id: 'dips', name: 'Dips' },
  },

  // Squat progressions
  'bodyweight-squat': {
    harder: { id: 'jump-squats', name: 'Jump Squats' },
    alternatives: [
      { id: 'goblet-squat', name: 'Goblet Squat' },
      { id: 'sumo-squat', name: 'Sumo Squat' },
    ],
  },
  'jump-squats': {
    easier: { id: 'bodyweight-squat', name: 'Bodyweight Squat' },
    harder: { id: 'pistol-squats', name: 'Pistol Squats' },
  },
  'pistol-squats': {
    easier: { id: 'assisted-pistol-squats', name: 'Assisted Pistol Squats' },
    alternatives: [
      { id: 'shrimp-squats', name: 'Shrimp Squats' },
      { id: 'sissy-squats', name: 'Sissy Squats' },
    ],
  },
  'assisted-pistol-squats': {
    easier: { id: 'bulgarian-split', name: 'Bulgarian Split Squat' },
    harder: { id: 'pistol-squats', name: 'Pistol Squats' },
  },

  // Lunge progressions
  'lunges': {
    harder: { id: 'jumping-lunges', name: 'Jumping Lunges' },
    alternatives: [
      { id: 'reverse-lunges', name: 'Reverse Lunges' },
      { id: 'walking-lunges', name: 'Walking Lunges' },
    ],
  },
  'bulgarian-split': {
    easier: { id: 'lunges', name: 'Lunges' },
    harder: { id: 'assisted-pistol-squats', name: 'Assisted Pistol Squats' },
  },

  // Core progressions
  'plank': {
    easier: { id: 'knee-plank', name: 'Knee Plank' },
    harder: { id: 'weighted-plank', name: 'Weighted Plank' },
    alternatives: [
      { id: 'side-plank', name: 'Side Plank' },
      { id: 'plank-to-push-up', name: 'Plank to Push-up' },
    ],
  },
  'hollow-hold': {
    easier: { id: 'dead-bug', name: 'Dead Bug' },
    harder: { id: 'dragon-flag', name: 'Dragon Flag' },
  },
  'hanging-leg-raise': {
    easier: { id: 'knee-raises', name: 'Knee Raises' },
    harder: { id: 'toes-to-bar', name: 'Toes to Bar' },
  },

  // Row progressions
  'inverted-rows': {
    easier: { id: 'elevated-rows', name: 'Elevated Rows' },
    harder: { id: 'archer-rows', name: 'Archer Rows' },
  },
  'archer-rows': {
    easier: { id: 'inverted-rows', name: 'Inverted Rows' },
    harder: { id: 'one-arm-rows', name: 'One-Arm Rows' },
  },
};

/**
 * Determines if an exercise is bodyweight-focused
 */
export function isBodyweightExercise(exercise: Exercise): boolean {
  return exercise.equipment.includes('Bodyweight') || 
         exercise.equipment.length === 1 && exercise.equipment[0] === 'Bodyweight';
}

/**
 * Analyzes bodyweight exercise performance and provides specific adaptations
 */
export function analyzeBodyweightAdaptation(
  exercise: Exercise,
  history: ExerciseHistory,
  currentSets: number,
  currentRepsRange: { min: number; max: number }
): AdaptationRecommendation {
  if (!isBodyweightExercise(exercise)) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      adaptationType: 'maintain',
      reason: 'Not a bodyweight exercise',
    };
  }

  if (history.sessions.length < 3) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      adaptationType: 'maintain',
      reason: 'Building baseline - keep current variation',
    };
  }

  const recentSessions = history.sessions.slice(0, 5);
  const olderSessions = history.sessions.slice(5, 10);

  // Calculate average reps per session
  const recentAvgReps = recentSessions.reduce((sum, s) => {
    const sessionAvgReps = s.sets.reduce((a, set) => a + set.reps, 0) / s.sets.length;
    return sum + sessionAvgReps;
  }, 0) / recentSessions.length;

  const olderAvgReps = olderSessions.length > 0
    ? olderSessions.reduce((sum, s) => {
        const sessionAvgReps = s.sets.reduce((a, set) => a + set.reps, 0) / s.sets.length;
        return sum + sessionAvgReps;
      }, 0) / olderSessions.length
    : recentAvgReps;

  // Check average RIR
  const avgRir = recentSessions.reduce((sum, s) => {
    const sessionAvgRir = s.sets.reduce((a, set) => a + (set.rir ?? 1), 0) / s.sets.length;
    return sum + sessionAvgRir;
  }, 0) / recentSessions.length;

  const progression = BODYWEIGHT_PROGRESSIONS[exercise.id];

  // Check for plateau (reps not increasing)
  const repsStagnant = olderAvgReps > 0 && Math.abs(recentAvgReps - olderAvgReps) / olderAvgReps < 0.05;

  // Determine if ready for harder variation
  const exceedsMaxReps = recentAvgReps >= currentRepsRange.max * 1.2; // 20% above max
  const highRepsLowRir = recentAvgReps >= currentRepsRange.max && avgRir >= 3;

  // Determine if variation is too hard
  const failingMinReps = recentAvgReps < currentRepsRange.min * 0.7; // 30% below min
  const lowRepsNoRir = recentAvgReps < currentRepsRange.min && avgRir < 1;

  // REGRESSION: Exercise is too hard, suggest easier variation
  if ((failingMinReps || lowRepsNoRir) && progression?.easier) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      adaptationType: 'regress-variation',
      reason: `Struggling with current variation (avg ${Math.round(recentAvgReps)} reps). Try an easier variation to build strength.`,
      progressionVariation: {
        id: progression.easier.id,
        name: progression.easier.name,
        difficulty: 'easier',
      },
    };
  }

  // PROGRESSION: Ready for harder variation
  if ((exceedsMaxReps || highRepsLowRir) && progression?.harder) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      adaptationType: 'progress-variation',
      reason: `Exceeding ${Math.round(recentAvgReps)} reps with ${Math.round(avgRir)} RIR. Ready for a harder variation!`,
      progressionVariation: {
        id: progression.harder.id,
        name: progression.harder.name,
        difficulty: 'harder',
      },
    };
  }

  // PLATEAU: Stuck at current level
  if (repsStagnant && avgRir < 2) {
    // Try alternative variation at similar difficulty
    if (progression?.alternatives && progression.alternatives.length > 0) {
      const alternative = progression.alternatives[0];
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        adaptationType: 'swap-exercise',
        reason: `Plateaued at ${Math.round(recentAvgReps)} reps for ${history.sessions.length} sessions. Try a variation for different stimulus.`,
        progressionVariation: {
          id: alternative.id,
          name: alternative.name,
          difficulty: 'harder',
        },
        alternativeExercises: progression.alternatives.map(a => a.id),
      };
    }

    // If no alternatives, suggest volume increase
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      adaptationType: 'increase-volume',
      reason: `Plateaued at ${Math.round(recentAvgReps)} reps. Add a set or increase time under tension.`,
      suggestedSets: currentSets + 1,
    };
  }

  // INCREASE REPS: Still progressing within current variation
  if (recentAvgReps > olderAvgReps && recentAvgReps < currentRepsRange.max) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      adaptationType: 'maintain',
      reason: `Progressing well! Keep pushing toward ${currentRepsRange.max} reps before moving to harder variation.`,
    };
  }

  // DEFAULT: Keep working
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    adaptationType: 'maintain',
    reason: 'Continue current training. Focus on form and controlled tempo.',
  };
}

/**
 * Get bodyweight progression recommendation for display
 */
export function getBodyweightProgressionPath(exerciseId: string): {
  easier?: string;
  harder?: string;
  alternatives?: string[];
} | null {
  const progression = BODYWEIGHT_PROGRESSIONS[exerciseId];
  if (!progression) return null;

  return {
    easier: progression.easier?.name,
    harder: progression.harder?.name,
    alternatives: progression.alternatives?.map(a => a.name),
  };
}
