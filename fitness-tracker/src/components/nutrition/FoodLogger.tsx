import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { FoodSearch } from './FoodSearch';
import { BarcodeScanner } from './BarcodeScanner';
import { Input } from '../shared/Input';
import { Plus, ScanBarcode } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { logMeal } from '../../services/nutrition.service';
import type { Food } from '../../types/nutrition.types';

interface FoodLoggerProps {
  date: string;
  onLogged?: () => void;
}

export function FoodLogger({ date, onLogged }: FoodLoggerProps) {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [servings, setServings] = useState('1');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food);
    setServings('1');
    setShowScanner(false);
  };

  const handleLog = async () => {
    if (!user || !selectedFood) return;
    setLoading(true);
    try {
      await logMeal(user.uid, date, {
        foodId: selectedFood.id,
        food: selectedFood,
        servings: Number(servings),
        mealType,
        timestamp: new Date(),
      });
      setIsOpen(false);
      setSelectedFood(null);
      onLogged?.();
    } catch (error) {
      console.error('Failed to log meal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus size={16} />
        Log Food
      </Button>

      <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setShowScanner(false); }} title="Log Food" size="lg">
        <div className="space-y-4">
          {!selectedFood ? (
            showScanner ? (
              <BarcodeScanner
                onResult={handleFoodSelect}
                onClose={() => setShowScanner(false)}
              />
            ) : (
              <>
                <FoodSearch onSelect={handleFoodSelect} />
                <div className="text-center">
                  <button
                    onClick={() => setShowScanner(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <ScanBarcode size={14} />
                    Scan Barcode
                  </button>
                </div>
              </>
            )
          ) : (
            <>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium text-gray-200">{selectedFood.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Per {selectedFood.servingSize}{selectedFood.servingUnit}:
                      {' '}{selectedFood.macros.calories} kcal |
                      P:{selectedFood.macros.protein}g
                      C:{selectedFood.macros.carbs}g
                      F:{selectedFood.macros.fats}g
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Servings"
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  min="0.1"
                  step="0.5"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Meal</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as typeof mealType)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
              </div>

              {Number(servings) > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-3 text-sm">
                  <div className="text-gray-400 mb-1">Total:</div>
                  <div className="flex gap-4 text-gray-300">
                    <span>{Math.round(selectedFood.macros.calories * Number(servings))} kcal</span>
                    <span>P:{Math.round(selectedFood.macros.protein * Number(servings))}g</span>
                    <span>C:{Math.round(selectedFood.macros.carbs * Number(servings))}g</span>
                    <span>F:{Math.round(selectedFood.macros.fats * Number(servings))}g</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleLog}
                loading={loading}
                className="w-full"
                disabled={!selectedFood || Number(servings) <= 0}
              >
                Log Food
              </Button>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
