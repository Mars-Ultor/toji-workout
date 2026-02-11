import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Workout, WorkoutSet, Exercise } from '../types/workout.types';
import { calculateProgression } from '../utils/calculations';
import { 
  isBodyweightExercise, 
  analyzeBodyweightAdaptation 
} from './bodyweightAdaptation.service';

// ── Types ───────────────────────────────────────────────────────────────────

export interface ExerciseHistory {
  exerciseId: string;
  exerciseName: string;
  sessions: ExerciseSession[];
}

export interface ExerciseSession {
  date: string;
  workoutId: string;
  sets: WorkoutSet[];
  bestSet: { weight: number; reps: number };
  totalVolume: number;
}

export interface ProgressionSuggestion {
  weight: number;
  reps: number;
  recommendation: string;
  trend: 'up' | 'maintain' | 'down' | 'deload';
  previousBest: { weight: number; reps: number } | null;
  consecutiveFailures: number;
}

export interface DeloadRecommendation {
  needed: boolean;
  reason: string;
  suggestedWeightMultiplier: number; // e.g. 0.85 = 85% of current weight
  suggestedVolumeMultiplier: number; // e.g. 0.6 = 60% of current volume
}

export interface AdaptationRecommendation {
  exerciseId: string;
  exerciseName: string;
  adaptationType: 'increase-volume' | 'increase-intensity' | 'decrease-volume' | 'swap-exercise' | 'deload' | 'maintain' | 'progress-variation' | 'regress-variation';
  reason: string;
  suggestedSets?: number;
  suggestedRepsRange?: string;
  suggestedRestSeconds?: number;
  alternativeExercises?: string[]; // IDs of similar exercises to swap to
  progressionVariation?: {
    name: string;
    id: string;
    difficulty: 'easier' | 'harder';
  };
}

export interface ProgressionScheme {
  type: 'linear' | 'double-progression' | 'wave';
  currentWeight: number;
  currentReps: number;
  nextWeight: number;
  nextReps: number;
  explanation: string;
}

// ── Fetch exercise history from workout logs ────────────────────────────────

/**
 * Get the last N sessions for a specific exercise by scanning workout history.
 */
export async function getExerciseHistory(
  userId: string,
  exerciseId: string,
  sessionLimit: number = 10
): Promise<ExerciseHistory | null> {
  // Fetch recent workouts (up to 50 to find enough data for the exercise)
  const q = query(
    collection(db, `workoutLogs/${userId}/sessions`),
    orderBy('date', 'desc'),
    limit(50)
  );

  const snapshot = await getDocs(q);
  const workouts = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Workout[];

  const sessions: ExerciseSession[] = [];
  let exerciseName = '';

  for (const workout of workouts) {
    if (sessions.length >= sessionLimit) break;

    for (const ex of workout.exercises) {
      if (ex.exerciseId === exerciseId || ex.exercise?.id === exerciseId) {
        exerciseName = ex.exercise?.name || exerciseId;
        const completedSets = ex.sets.filter((s) => s.completed);
        if (completedSets.length === 0) continue;

        const bestSet = completedSets.reduce((best, s) =>
          s.weight * s.reps > best.weight * best.reps ? s : best
        );
        const totalVolume = completedSets.reduce((v, s) => v + s.weight * s.reps, 0);

        sessions.push({
          date: workout.date,
          workoutId: workout.id,
          sets: completedSets,
          bestSet: { weight: bestSet.weight, reps: bestSet.reps },
          totalVolume,
        });
      }
    }
  }

  if (sessions.length === 0) return null;

  return { exerciseId, exerciseName, sessions };
}

/**
 * Get history for multiple exercises at once (for pre-loading when starting a workout).
 */
export async function getMultiExerciseHistory(
  userId: string,
  exerciseIds: string[]
): Promise<Map<string, ExerciseHistory>> {
  const q = query(
    collection(db, `workoutLogs/${userId}/sessions`),
    orderBy('date', 'desc'),
    limit(50)
  );

  const snapshot = await getDocs(q);
  const workouts = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Workout[];

  const historyMap = new Map<string, ExerciseSession[]>();
  const nameMap = new Map<string, string>();

  for (const workout of workouts) {
    for (const ex of workout.exercises) {
      const eid = ex.exerciseId || ex.exercise?.id;
      if (!eid || !exerciseIds.includes(eid)) continue;

      nameMap.set(eid, ex.exercise?.name || eid);
      const existing = historyMap.get(eid) || [];
      if (existing.length >= 10) continue;

      const completedSets = ex.sets.filter((s) => s.completed);
      if (completedSets.length === 0) continue;

      const bestSet = completedSets.reduce((best, s) =>
        s.weight * s.reps > best.weight * best.reps ? s : best
      );

      existing.push({
        date: workout.date,
        workoutId: workout.id,
        sets: completedSets,
        bestSet: { weight: bestSet.weight, reps: bestSet.reps },
        totalVolume: completedSets.reduce((v, s) => v + s.weight * s.reps, 0),
      });
      historyMap.set(eid, existing);
    }
  }

  const result = new Map<string, ExerciseHistory>();
  for (const [id, sessions] of historyMap) {
    result.set(id, {
      exerciseId: id,
      exerciseName: nameMap.get(id) || id,
      sessions,
    });
  }
  return result;
}

// ── Progression suggestions ─────────────────────────────────────────────────

/**
 * Generate weight/rep suggestion for next set based on exercise history.
 */
export function getSuggestion(
  history: ExerciseHistory | null,
  targetReps?: number
): ProgressionSuggestion {
  // No history — return zeroes
  if (!history || history.sessions.length === 0) {
    return {
      weight: 0,
      reps: targetReps || 0,
      recommendation: 'First time — start light and find your working weight',
      trend: 'maintain',
      previousBest: null,
      consecutiveFailures: 0,
    };
  }

  const lastSession = history.sessions[0];
  const lastBest = lastSession.bestSet;
  const target = targetReps || lastBest.reps;

  // Count consecutive sessions where user failed to hit target reps
  let consecutiveFailures = 0;
  for (const session of history.sessions) {
    const avgReps = session.sets.reduce((a, s) => a + s.reps, 0) / session.sets.length;
    if (avgReps < target * 0.9) {
      consecutiveFailures++;
    } else {
      break;
    }
  }

  // Deload recommendation if 3+ consecutive failures
  if (consecutiveFailures >= 3) {
    return {
      weight: Number((lastBest.weight * 0.85).toFixed(1)),
      reps: target,
      recommendation: `Deload: reduce to ${Math.round(lastBest.weight * 0.85)} for ${target} reps. You've missed targets ${consecutiveFailures} sessions in a row.`,
      trend: 'deload',
      previousBest: lastBest,
      consecutiveFailures,
    };
  }

  // Use the average RIR from the last session to determine progression
  const avgRir = lastSession.sets.reduce((a, s) => a + (s.rir ?? 1), 0) / lastSession.sets.length;
  const avgReps = lastSession.sets.reduce((a, s) => a + s.reps, 0) / lastSession.sets.length;

  const progression = calculateProgression(lastBest.weight, target, Math.round(avgReps), Math.round(avgRir));

  let trend: 'up' | 'maintain' | 'down' = 'maintain';
  if (progression.newWeight > lastBest.weight) trend = 'up';
  else if (progression.newWeight < lastBest.weight) trend = 'down';

  return {
    weight: progression.newWeight,
    reps: progression.newReps,
    recommendation: progression.recommendation,
    trend,
    previousBest: lastBest,
    consecutiveFailures,
  };
}

// ── Deload detection ────────────────────────────────────────────────────────

/**
 * Analyze recent workout history and determine if a deload week is needed.
 */
export async function checkDeloadNeeded(
  userId: string
): Promise<DeloadRecommendation> {
  const q = query(
    collection(db, `workoutLogs/${userId}/sessions`),
    orderBy('date', 'desc'),
    limit(20)
  );

  const snapshot = await getDocs(q);
  const workouts = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Workout[];

  if (workouts.length < 6) {
    return {
      needed: false,
      reason: 'Not enough training data yet',
      suggestedWeightMultiplier: 1,
      suggestedVolumeMultiplier: 1,
    };
  }

  // Check: have we been training 4+ weeks without a break?
  const dates = workouts 
    .map((w) => new Date(w.date))
    .filter((d) => !isNaN(d.getTime()));

  if (dates.length < 2) {
    return { needed: false, reason: 'Insufficient data', suggestedWeightMultiplier: 1, suggestedVolumeMultiplier: 1 };
  }

  const trainingSpanDays = Math.round(
    (dates[0].getTime() - dates[dates.length - 1].getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check volume trend — are recent sessions' total volume declining?
  const recentVolumes = workouts.slice(0, 5).map((w) =>
    w.exercises.reduce(
      (v, ex) => v + ex.sets.filter((s) => s.completed).reduce((sv, s) => sv + s.weight * s.reps, 0),
      0
    )
  );
  const olderVolumes = workouts.slice(5, 10).map((w) =>
    w.exercises.reduce(
      (v, ex) => v + ex.sets.filter((s) => s.completed).reduce((sv, s) => sv + s.weight * s.reps, 0),
      0
    )
  );

  const avgRecent = recentVolumes.length > 0
    ? recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length
    : 0;
  const avgOlder = olderVolumes.length > 0
    ? olderVolumes.reduce((a, b) => a + b, 0) / olderVolumes.length
    : 0;

  // Check for missed reps (incomplete sets) trend
  const recentCompletionRates = workouts.slice(0, 5).map((w) => {
    const totalSets = w.exercises.reduce((a, ex) => a + ex.sets.length, 0);
    const completedSets = w.exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.completed).length, 0);
    return totalSets > 0 ? completedSets / totalSets : 1;
  });
  const avgCompletion = recentCompletionRates.reduce((a, b) => a + b, 0) / recentCompletionRates.length;

  // Decision logic
  const volumeDeclining = avgOlder > 0 && avgRecent < avgOlder * 0.85;
  const longStreak = trainingSpanDays >= 28 && workouts.length >= 12;
  const lowCompletion = avgCompletion < 0.75;

  if (volumeDeclining && longStreak) {
    return {
      needed: true,
      reason: `Volume has dropped ${Math.round((1 - avgRecent / avgOlder) * 100)}% over recent sessions after ${trainingSpanDays} days of training. Time for a deload week.`,
      suggestedWeightMultiplier: 0.85,
      suggestedVolumeMultiplier: 0.6,
    };
  }

  if (lowCompletion && longStreak) {
    return {
      needed: true,
      reason: `Set completion rate has dropped to ${Math.round(avgCompletion * 100)}%. A deload will help you recover and push through the plateau.`,
      suggestedWeightMultiplier: 0.85,
      suggestedVolumeMultiplier: 0.6,
    };
  }

  if (longStreak && workouts.length >= 16) {
    return {
      needed: true,
      reason: `You've been training for ${trainingSpanDays} days (${workouts.length} sessions) without a light week. A proactive deload is recommended.`,
      suggestedWeightMultiplier: 0.9,
      suggestedVolumeMultiplier: 0.7,
    };
  }

  return {
    needed: false,
    reason: 'Training load looks sustainable. Keep pushing!',
    suggestedWeightMultiplier: 1,
    suggestedVolumeMultiplier: 1,
  };
}

// ── Auto-progression for programs ───────────────────────────────────────────

/**
 * After a workout session, suggest updated targets for matching program exercises.
 * Returns a map of exerciseId -> { newSets, newWeight (estimated), recommendation }
 */
export function generateProgramUpdates(
  completedExercises: { exerciseId: string; sets: WorkoutSet[] }[],
  programTargets: { exerciseId: string; sets: number; repsMin: number; repsMax: number }[]
): Map<string, { sets: number; repsMin: number; repsMax: number; recommendation: string }> {
  const updates = new Map<string, { sets: number; repsMin: number; repsMax: number; recommendation: string }>();

  for (const target of programTargets) {
    const completed = completedExercises.find((e) => e.exerciseId === target.exerciseId);
    if (!completed) continue;

    const doneSets = completed.sets.filter((s) => s.completed);
    if (doneSets.length === 0) continue;

    const avgReps = doneSets.reduce((a, s) => a + s.reps, 0) / doneSets.length;
    const avgRir = doneSets.reduce((a, s) => a + (s.rir ?? 1), 0) / doneSets.length;

    // Completed all sets at top of rep range with RIR >= 2: increase rep range
    if (avgReps >= target.repsMax && avgRir >= 2) {
      updates.set(target.exerciseId, {
        sets: target.sets,
        repsMin: target.repsMin,
        repsMax: target.repsMax,
        recommendation: `Increase weight next session. Hit ${Math.round(avgReps)} reps with ${Math.round(avgRir)} RIR.`,
      });
    }
    // Couldn't hit bottom of rep range: reduce
    else if (avgReps < target.repsMin) {
      updates.set(target.exerciseId, {
        sets: target.sets,
        repsMin: target.repsMin,
        repsMax: target.repsMax,
        recommendation: `Consider lowering weight. Only managed ${Math.round(avgReps)} reps (target: ${target.repsMin}-${target.repsMax}).`,
      });
    }
    // Good, within range
    else {
      updates.set(target.exerciseId, {
        sets: target.sets,
        repsMin: target.repsMin,
        repsMax: target.repsMax,
        recommendation: `Good work! ${Math.round(avgReps)} reps is within target range.`,
      });
    }
  }

  return updates;
}
// ── Exercise Adaptation ─────────────────────────────────────────────────────

/**
 * Analyzes exercise history to determine if adaptations are needed
 * (volume changes, intensity changes, exercise swaps, etc.)
 */
export function analyzeExerciseAdaptation(
  history: ExerciseHistory,
  currentSets: number,
  currentRepsRange: { min: number; max: number },
  exercise?: Exercise
): AdaptationRecommendation {
  // Route to bodyweight-specific adaptation if applicable
  if (exercise && isBodyweightExercise(exercise)) {
    return analyzeBodyweightAdaptation(exercise, history, currentSets, currentRepsRange);
  }

  if (history.sessions.length < 3) {
    return {
      exerciseId: history.exerciseId,
      exerciseName: history.exerciseName,
      adaptationType: 'maintain',
      reason: 'Not enough data to suggest adaptations yet',
    };
  }

  const recentSessions = history.sessions.slice(0, 5);
  const olderSessions = history.sessions.slice(5, 10);

  // Calculate average volume per session
  const recentAvgVolume = recentSessions.reduce((sum, s) => sum + s.totalVolume, 0) / recentSessions.length;
  const olderAvgVolume = olderSessions.length > 0 
    ? olderSessions.reduce((sum, s) => sum + s.totalVolume, 0) / olderSessions.length 
    : recentAvgVolume;

  // Check for plateau (volume not increasing over time)
  const volumeStagnant = olderAvgVolume > 0 && Math.abs(recentAvgVolume - olderAvgVolume) / olderAvgVolume < 0.05;

  // Check average RIR
  const avgRir = recentSessions.reduce((sum, s) => {
    const sessionAvgRir = s.sets.reduce((a, set) => a + (set.rir ?? 1), 0) / s.sets.length;
    return sum + sessionAvgRir;
  }, 0) / recentSessions.length;

  // Check average reps
  const avgReps = recentSessions.reduce((sum, s) => {
    const sessionAvgReps = s.sets.reduce((a, set) => a + set.reps, 0) / s.sets.length;
    return sum + sessionAvgReps;
  }, 0) / recentSessions.length;

  // Check for declining performance
  const performanceDecline = olderAvgVolume > 0 && recentAvgVolume < olderAvgVolume * 0.85;

  // Adaptation logic
  if (performanceDecline) {
    return {
      exerciseId: history.exerciseId,
      exerciseName: history.exerciseName,
      adaptationType: 'deload',
      reason: `Volume has declined by ${Math.round((1 - recentAvgVolume / olderAvgVolume) * 100)}%. Time to deload or reduce intensity.`,
      suggestedSets: Math.max(1, currentSets - 1),
      suggestedRepsRange: `${currentRepsRange.min}-${currentRepsRange.max}`,
      suggestedRestSeconds: 120,
    };
  }

  if (volumeStagnant && avgRir >= 3) {
    // Hitting a plateau but still have RIR left - increase intensity
    return {
      exerciseId: history.exerciseId,
      exerciseName: history.exerciseName,
      adaptationType: 'increase-intensity',
      reason: `Volume has plateaued at ${Math.round(recentAvgVolume)}${history.sessions[0].sets[0] ? ' kg' : ''}, but you have ${Math.round(avgRir)} RIR. Increase weight or decrease rest time.`,
      suggestedRestSeconds: Math.max(30, (recentSessions[0].sets[0]?.restSeconds || 90) - 15),
    };
  }

  if (volumeStagnant && avgRir < 1) {
    // Plateau and no RIR left - might need volume increase or exercise swap
    const sessionsCount = history.sessions.length;
    if (sessionsCount >= 8) {
      return {
        exerciseId: history.exerciseId,
        exerciseName: history.exerciseName,
        adaptationType: 'swap-exercise',
        reason: `You've plateaued on this exercise for ${sessionsCount} sessions with no RIR left. Consider swapping to a similar variation.`,
      };
    } else {
      return {
        exerciseId: history.exerciseId,
        exerciseName: history.exerciseName,
        adaptationType: 'increase-volume',
        reason: `Plateaued with minimal RIR. Try adding a set or increasing rep range.`,
        suggestedSets: currentSets + 1,
        suggestedRepsRange: `${currentRepsRange.min + 2}-${currentRepsRange.max + 2}`,
      };
    }
  }

  if (avgReps >= currentRepsRange.max && avgRir >= 2) {
    return {
      exerciseId: history.exerciseId,
      exerciseName: history.exerciseName,
      adaptationType: 'increase-intensity',
      reason: `Consistently hitting ${Math.round(avgReps)} reps with ${Math.round(avgRir)} RIR. Ready to increase weight.`,
    };
  }

  return {
    exerciseId: history.exerciseId,
    exerciseName: history.exerciseName,
    adaptationType: 'maintain',
    reason: 'Progressing well. Keep current structure.',
  };
}

/**
 * Apply a specific progression scheme to calculate next session's targets
 */
export function applyProgressionScheme(
  scheme: 'linear' | 'double-progression' | 'wave',
  currentWeight: number,
  currentReps: number,
  targetRepsMin: number,
  targetRepsMax: number,
  avgRir: number
): ProgressionScheme {
  switch (scheme) {
    case 'linear':
      // Simple: if hit top of rep range with RIR >= 2, add weight
      if (currentReps >= targetRepsMax && avgRir >= 2) {
        const increment = currentWeight > 100 ? 5 : 2.5;
        return {
          type: 'linear',
          currentWeight,
          currentReps,
          nextWeight: currentWeight + increment,
          nextReps: targetRepsMin,
          explanation: `Linear progression: Add ${increment} and drop back to ${targetRepsMin} reps`,
        };
      }
      return {
        type: 'linear',
        currentWeight,
        currentReps,
        nextWeight: currentWeight,
        nextReps: targetRepsMax,
        explanation: 'Keep weight, aim for top of rep range',
      };

    case 'double-progression':
      // Increase reps first, then weight
      if (currentReps >= targetRepsMax && avgRir >= 2) {
        const increment = currentWeight > 100 ? 5 : 2.5;
        return {
          type: 'double-progression',
          currentWeight,
          currentReps,
          nextWeight: currentWeight + increment,
          nextReps: targetRepsMin,
          explanation: `Double progression: Hit ${targetRepsMax} reps, now add ${increment} and start at ${targetRepsMin} reps`,
        };
      }
      return {
        type: 'double-progression',
        currentWeight,
        currentReps,
        nextWeight: currentWeight,
        nextReps: Math.min(currentReps + 1, targetRepsMax),
        explanation: `Double progression: Add 1 rep, work toward ${targetRepsMax}`,
      };

    case 'wave': {
      // Periodized waves: alternate between heavy/low and light/high
      const isHeavyWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % 2 === 0;
      if (isHeavyWeek) {
        return {
          type: 'wave',
          currentWeight,
          currentReps,
          nextWeight: currentWeight * 1.05,
          nextReps: targetRepsMin,
          explanation: `Wave progression: Heavy week - increase weight by 5%, lower reps to ${targetRepsMin}`,
        };
      } else {
        return {
          type: 'wave',
          currentWeight,
          currentReps,
          nextWeight: currentWeight * 0.9,
          nextReps: targetRepsMax + 2,
          explanation: `Wave progression: Light week - reduce weight by 10%, increase reps to ${targetRepsMax + 2}`,
        };
      }
    }

    default:
      return {
        type: 'linear',
        currentWeight,
        currentReps,
        nextWeight: currentWeight,
        nextReps: currentReps,
        explanation: 'Maintain current weight and reps',
      };
  }
}