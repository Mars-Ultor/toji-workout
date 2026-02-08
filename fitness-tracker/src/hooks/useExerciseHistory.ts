import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  getMultiExerciseHistory,
  getSuggestion,
  checkDeloadNeeded,
  type ExerciseHistory,
  type ProgressionSuggestion,
  type DeloadRecommendation,
} from '../services/progression.service';

/**
 * Hook that loads exercise history for a list of exercise IDs
 * and provides progression suggestions for each.
 */
export function useExerciseHistory(exerciseIds: string[]) {
  const { user } = useAuthStore();
  const [historyMap, setHistoryMap] = useState<Map<string, ExerciseHistory>>(new Map());
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || exerciseIds.length === 0) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const map = await getMultiExerciseHistory(user!.uid, exerciseIds);
        if (!cancelled) {
          setHistoryMap(map);
          setLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load exercise history:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
    // Only re-fetch when the set of IDs changes (joined as string for stable deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, exerciseIds.join(',')]);

  const getHistory = useCallback(
    (exerciseId: string): ExerciseHistory | null => {
      return historyMap.get(exerciseId) || null;
    },
    [historyMap]
  );

  const getSuggestionFor = useCallback(
    (exerciseId: string, targetReps?: number): ProgressionSuggestion => {
      return getSuggestion(historyMap.get(exerciseId) || null, targetReps);
    },
    [historyMap]
  );

  return { historyMap, loading, loaded, getHistory, getSuggestionFor };
}

/**
 * Hook that checks if the user needs a deload week.
 */
export function useDeloadCheck() {
  const { user } = useAuthStore();
  const [deload, setDeload] = useState<DeloadRecommendation | null>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await checkDeloadNeeded(user.uid);
      setDeload(result);
    } catch (error) {
      console.error('Deload check failed:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    check();
  }, [check]);

  return { deload, loading, recheck: check };
}
