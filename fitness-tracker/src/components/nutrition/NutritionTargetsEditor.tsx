import { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { useNutritionStore } from '../../store/nutritionStore';
import { useAuthStore } from '../../store/authStore';
import { updateNutritionTargets } from '../../services/nutrition.service';
import { useToastStore } from '../../store/toastStore';
import { Target, Zap } from 'lucide-react';
import { calculateBMR, estimateTDEE, calculateCalorieTarget, calculateMacros } from '../../utils/calculations';

export function NutritionTargetsEditor() {
  const { user, profile } = useAuthStore();
  const { targets, setTargets } = useNutritionStore();
  const { addToast } = useToastStore();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    calories: targets?.calories?.toString() || '2200',
    protein: targets?.protein?.toString() || '165',
    carbs: targets?.carbs?.toString() || '220',
    fats: targets?.fats?.toString() || '73',
  });

  const handleAutoCalculate = () => {
    if (!profile?.age || !profile?.height || !profile?.weight) {
      addToast({ type: 'error', message: 'Please complete your profile (age, height, weight) first' });
      return;
    }
    const bmr = calculateBMR(
      profile.weight,
      profile.height,
      profile.age,
      profile.gender || 'male'
    );
    const tdee = estimateTDEE(bmr, profile.activityLevel);
    const cals = calculateCalorieTarget(tdee, profile.goal);
    const macros = calculateMacros(cals, profile.weight, profile.goal);
    setForm({
      calories: cals.toString(),
      protein: macros.protein.toString(),
      carbs: macros.carbs.toString(),
      fats: macros.fats.toString(),
    });
    addToast({ type: 'info', message: `Estimated TDEE: ${tdee} kcal` });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const newTargets = {
        calories: parseInt(form.calories) || 2200,
        protein: parseInt(form.protein) || 165,
        carbs: parseInt(form.carbs) || 220,
        fats: parseInt(form.fats) || 73,
      };
      await updateNutritionTargets(user.uid, newTargets);
      setTargets(newTargets);
      setIsEditing(false);
      addToast({ type: 'success', message: 'Targets updated' });
    } catch {
      addToast({ type: 'error', message: 'Failed to save targets' });
    } finally {
      setSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Target className="text-yellow-500" size={20} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-200">
              {targets ? `${targets.calories} kcal target` : 'No targets set'}
            </div>
            <div className="text-xs text-gray-500">
              {targets
                ? `P: ${targets.protein}g · C: ${targets.carbs}g · F: ${targets.fats}g`
                : 'Set your daily nutrition goals'}
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => setIsEditing(true)}>
          {targets ? 'Edit' : 'Set Targets'}
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Target size={16} /> Nutrition Targets
        </h3>
        <Button variant="ghost" size="sm" onClick={handleAutoCalculate}>
          <Zap size={14} /> Auto-Calculate
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Calories (kcal)"
          type="number"
          value={form.calories}
          onChange={(e) => setForm({ ...form, calories: e.target.value })}
        />
        <Input
          label="Protein (g)"
          type="number"
          value={form.protein}
          onChange={(e) => setForm({ ...form, protein: e.target.value })}
        />
        <Input
          label="Carbs (g)"
          type="number"
          value={form.carbs}
          onChange={(e) => setForm({ ...form, carbs: e.target.value })}
        />
        <Input
          label="Fats (g)"
          type="number"
          value={form.fats}
          onChange={(e) => setForm({ ...form, fats: e.target.value })}
        />
      </div>
      <div className="flex gap-2 justify-end mt-4">
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} loading={saving}>
          Save Targets
        </Button>
      </div>
    </Card>
  );
}
