import { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { useBodyMetrics } from '../../hooks/useBodyMetrics';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Scale, Plus } from 'lucide-react';

export function BodyMetricsLogger() {
  const { addMetrics, latestWeight } = useBodyMetrics();
  const { profile } = useAuthStore();
  const { addToast } = useToastStore();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weight, setWeight] = useState(latestWeight?.toString() || '');
  const [bodyFat, setBodyFat] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      addToast({ type: 'error', message: 'Please enter a valid weight' });
      return;
    }
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await addMetrics({
        date: today,
        weight: w,
        bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      });
      addToast({ type: 'success', message: 'Weight logged!' });
      setIsOpen(false);
    } catch {
      addToast({ type: 'error', message: 'Failed to log weight' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Scale className="text-green-500" size={20} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-200">
              {latestWeight ? `${latestWeight} ${profile?.preferences.weightUnit || 'lbs'}` : 'No weight logged'}
            </div>
            <div className="text-xs text-gray-500">Current weight</div>
          </div>
        </div>
        <Button size="sm" onClick={() => setIsOpen(true)}>
          <Plus size={14} /> Log Weight
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <Scale size={16} /> Log Body Metrics
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Weight (${profile?.preferences.weightUnit || 'lbs'})`}
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 75.5"
            required
          />
          <Input
            label="Body Fat % (optional)"
            type="number"
            step="0.1"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            placeholder="e.g. 15"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} type="button">
            Cancel
          </Button>
          <Button size="sm" loading={saving} type="submit">
            Save
          </Button>
        </div>
      </form>
    </Card>
  );
}
