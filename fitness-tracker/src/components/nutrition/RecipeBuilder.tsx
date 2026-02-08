import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { FoodSearch } from './FoodSearch';
import { ChefHat, Plus, Trash2, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { saveRecipe } from '../../services/recipe.service';
import type { Recipe, RecipeIngredient, Food } from '../../types/nutrition.types';

interface RecipeBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  existingRecipe?: Recipe;
}

export function RecipeBuilder({ isOpen, onClose, onSaved, existingRecipe }: RecipeBuilderProps) {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState(existingRecipe?.name || '');
  const [description, setDescription] = useState(existingRecipe?.description || '');
  const [servingsCount, setServingsCount] = useState(String(existingRecipe?.servingsCount || 1));
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(existingRecipe?.ingredients || []);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddIngredient = (food: Food) => {
    const newIngredient: RecipeIngredient = {
      foodId: food.id,
      food,
      servings: 1,
    };
    setIngredients([...ingredients, newIngredient]);
    setShowFoodSearch(false);
  };

  const handleUpdateServings = (index: number, servings: string) => {
    const updated = [...ingredients];
    updated[index].servings = Number(servings) || 0;
    setIngredients(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const totals = ingredients.reduce(
      (acc, ing) => ({
        calories: acc.calories + ing.food.macros.calories * ing.servings,
        protein: acc.protein + ing.food.macros.protein * ing.servings,
        carbs: acc.carbs + ing.food.macros.carbs * ing.servings,
        fats: acc.fats + ing.food.macros.fats * ing.servings,
        fiber: acc.fiber + (ing.food.macros.fiber || 0) * ing.servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );

    const servings = Number(servingsCount) || 1;
    return {
      total: totals,
      perServing: {
        calories: Math.round(totals.calories / servings),
        protein: Math.round((totals.protein / servings) * 10) / 10,
        carbs: Math.round((totals.carbs / servings) * 10) / 10,
        fats: Math.round((totals.fats / servings) * 10) / 10,
        fiber: Math.round((totals.fiber / servings) * 10) / 10,
      },
    };
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      addToast({ message: 'Please enter a recipe name', type: 'error' });
      return;
    }
    if (ingredients.length === 0) {
      addToast({ message: 'Please add at least one ingredient', type: 'error' });
      return;
    }
    if (Number(servingsCount) <= 0) {
      addToast({ message: 'Servings count must be greater than 0', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const macrosPerServing = calculateTotals().perServing;
      const recipe: Recipe = {
        id: existingRecipe?.id || `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: description.trim() || undefined,
        ingredients,
        servingsCount: Number(servingsCount),
        macrosPerServing,
        createdBy: user.uid,
        createdAt: existingRecipe?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await saveRecipe(user.uid, recipe);
      addToast({ message: `Recipe "${name}" saved successfully`, type: 'success' });
      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Failed to save recipe:', error);
      addToast({ message: 'Failed to save recipe', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingRecipe ? 'Edit Recipe' : 'Create Recipe'} size="xl">
      <div className="space-y-4">
        {/* Recipe Info */}
        <div className="space-y-3">
          <Input
            label="Recipe Name"
            placeholder="e.g., Protein Smoothie"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Description (optional)"
            placeholder="e.g., Post-workout favorite"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label="Number of Servings"
            type="number"
            min="0.5"
            step="0.5"
            value={servingsCount}
            onChange={(e) => setServingsCount(e.target.value)}
          />
        </div>

        {/* Ingredients Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">Ingredients</h3>
            <button
              onClick={() => setShowFoodSearch(!showFoodSearch)}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              {showFoodSearch ? <X size={14} /> : <Plus size={14} />}
              {showFoodSearch ? 'Cancel' : 'Add Ingredient'}
            </button>
          </div>

          {showFoodSearch && (
            <div className="bg-gray-900 rounded-lg p-3">
              <FoodSearch onSelect={handleAddIngredient} />
            </div>
          )}

          {ingredients.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">
              No ingredients added yet
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-200 truncate">
                      {ingredient.food.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {ingredient.food.servingSize}{ingredient.food.servingUnit} = {ingredient.food.macros.calories} kcal
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={ingredient.servings}
                      onChange={(e) => handleUpdateServings(index, e.target.value)}
                      className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                    <button
                      onClick={() => handleRemoveIngredient(index)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nutrition Summary */}
        {ingredients.length > 0 && Number(servingsCount) > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Recipe</div>
              <div className="text-sm text-gray-300 flex gap-4">
                <span>{Math.round(totals.total.calories)} kcal</span>
                <span>P:{Math.round(totals.total.protein)}g</span>
                <span>C:{Math.round(totals.total.carbs)}g</span>
                <span>F:{Math.round(totals.total.fats)}g</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Per Serving ({servingsCount} servings total)</div>
              <div className="text-sm font-medium text-white flex gap-4">
                <span>{totals.perServing.calories} kcal</span>
                <span>P:{totals.perServing.protein}g</span>
                <span>C:{totals.perServing.carbs}g</span>
                <span>F:{totals.perServing.fats}g</span>
                {totals.perServing.fiber > 0 && <span>Fiber:{totals.perServing.fiber}g</span>}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={loading}
            disabled={!name.trim() || ingredients.length === 0 || Number(servingsCount) <= 0}
            className="flex-1"
          >
            <ChefHat size={16} />
            {existingRecipe ? 'Update Recipe' : 'Save Recipe'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
