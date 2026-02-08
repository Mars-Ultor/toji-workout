import { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { saveCustomFood, getCustomFoods, deleteCustomFood } from '../../services/food.service';
import { Plus, Trash2, Database } from 'lucide-react';
import type { Food } from '../../types/nutrition.types';

interface CustomFoodsDatabaseProps {
  onSelectFood?: (food: Food) => void;
}

export function CustomFoodsDatabase({ onSelectFood }: CustomFoodsDatabaseProps) {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    servingSize: '100',
    servingUnit: 'g',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  });

  useEffect(() => {
    if (!user) return;
    const fetchFoods = async () => {
      try {
        const data = await getCustomFoods(user.uid);
        setFoods(data);
      } catch {
        addToast({ type: 'error', message: 'Failed to load custom foods' });
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, [user, addToast]);

  const handleSave = async () => {
    if (!user || !form.name || !form.calories) return;
    setSaving(true);
    try {
      const food: Food = {
        id: `custom-${Date.now()}`,
        name: form.name,
        servingSize: parseFloat(form.servingSize) || 100,
        servingUnit: form.servingUnit,
        macros: {
          calories: parseInt(form.calories) || 0,
          protein: parseInt(form.protein) || 0,
          carbs: parseInt(form.carbs) || 0,
          fats: parseInt(form.fats) || 0,
        },
        verified: false,
      };
      await saveCustomFood(user.uid, food);
      setFoods((prev) => [...prev, food].sort((a, b) => a.name.localeCompare(b.name)));
      setShowAddModal(false);
      setForm({ name: '', servingSize: '100', servingUnit: 'g', calories: '', protein: '', carbs: '', fats: '' });
      addToast({ type: 'success', message: 'Food saved!' });
    } catch {
      addToast({ type: 'error', message: 'Failed to save food' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (foodId: string) => {
    if (!user || !window.confirm('Delete this food?')) return;
    try {
      await deleteCustomFood(user.uid, foodId);
      setFoods((prev) => prev.filter((f) => f.id !== foodId));
      addToast({ type: 'success', message: 'Food deleted' });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete food' });
    }
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Database size={16} /> My Foods
          </h3>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> Add Food
          </Button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500 py-4 text-center">Loading...</div>
        ) : foods.length === 0 ? (
          <div className="text-sm text-gray-500 py-4 text-center">
            No custom foods yet. Add your frequently eaten foods for quick logging.
          </div>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {foods.map((food) => (
              <div
                key={food.id}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-800/50 group cursor-pointer"
                onClick={() => onSelectFood?.(food)}
              >
                <div>
                  <div className="text-sm text-gray-200">{food.name}</div>
                  <div className="text-xs text-gray-500">
                    {food.macros.calories} kcal · P:{food.macros.protein}g C:{food.macros.carbs}g F:{food.macros.fats}g
                    {' '}per {food.servingSize}{food.servingUnit}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(food.id);
                  }}
                  className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Custom Food">
        <div className="space-y-4">
          <Input
            label="Food Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Homemade Granola"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Serving Size"
              type="number"
              value={form.servingSize}
              onChange={(e) => setForm({ ...form, servingSize: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
              <select
                value={form.servingUnit}
                onChange={(e) => setForm({ ...form, servingUnit: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value="g">grams</option>
                <option value="ml">ml</option>
                <option value="oz">oz</option>
                <option value="cup">cup</option>
                <option value="tbsp">tbsp</option>
                <option value="serving">serving</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Calories"
              type="number"
              value={form.calories}
              onChange={(e) => setForm({ ...form, calories: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Protein (g)"
              type="number"
              value={form.protein}
              onChange={(e) => setForm({ ...form, protein: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Carbs (g)"
              type="number"
              value={form.carbs}
              onChange={(e) => setForm({ ...form, carbs: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Fats (g)"
              type="number"
              value={form.fats}
              onChange={(e) => setForm({ ...form, fats: e.target.value })}
              placeholder="0"
            />
          </div>
          <Button
            onClick={handleSave}
            loading={saving}
            className="w-full"
            disabled={!form.name || !form.calories}
          >
            Save Food
          </Button>
        </div>
      </Modal>
    </>
  );
}
