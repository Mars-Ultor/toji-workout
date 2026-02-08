import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import type { Food } from '../../types/nutrition.types';

interface QuickAddFoodProps {
  onAdd: (food: Food, servings: number, mealType: string) => void;
}

export function QuickAddFood({ onAdd }: QuickAddFoodProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [mealType, setMealType] = useState('snack');

  const handleSubmit = () => {
    if (!name || !calories) return;

    const food: Food = {
      id: `quick-${crypto.randomUUID()}`,
      name,
      servingSize: 1,
      servingUnit: 'serving',
      macros: {
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fats: Number(fats) || 0,
      },
      verified: false,
    };

    onAdd(food, 1, mealType);
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        <Plus size={16} />
        Quick Add
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Quick Add Food">
        <div className="space-y-4">
          <Input
            label="Food Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Chicken salad"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Calories"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
            />
            <Input
              label="Protein (g)"
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="0"
            />
            <Input
              label="Carbs (g)"
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="0"
            />
            <Input
              label="Fats (g)"
              type="number"
              value={fats}
              onChange={(e) => setFats(e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Meal</label>
            <div className="flex gap-2">
              {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    mealType === type
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!name || !calories}>
            Add Food
          </Button>
        </div>
      </Modal>
    </>
  );
}
