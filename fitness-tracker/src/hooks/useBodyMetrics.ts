import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { getBodyMetricsHistory, logBodyMetrics } from '../services/analytics.service';
import type { BodyMetrics } from '../types/user.types';

export function useBodyMetrics() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<BodyMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getBodyMetricsHistory(user.uid);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch body metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const addMetrics = async (data: BodyMetrics) => {
    if (!user) return;
    await logBodyMetrics(user.uid, data);
    await fetchMetrics();
  };

  const latestWeight = metrics.length > 0 ? metrics[0].weight : null;

  return { metrics, loading, addMetrics, latestWeight, refetch: fetchMetrics };
}
