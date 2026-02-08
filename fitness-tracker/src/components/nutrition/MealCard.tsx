import { Trash2 } from 'lucide-react';
import type { MealEntry } from '../../types/nutrition.types';

interface MealCardProps {
  meal: MealEntry;
  onDelete: (id: string) => void;
}

export function MealCard({ meal, onDelete }: MealCardProps) {
  const calories = Math.round(meal.food.macros.calories * meal.servings);

  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-800/50 group">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-200 truncate">
          {meal.food.name}
        </div>
        <div className="flex gap-3 text-[11px] text-gray-500 mt-0.5">
          <span>{meal.servings} × {meal.food.servingSize}{meal.food.servingUnit}</span>
          <span>P:{Math.round(meal.food.macros.protein * meal.servings)}g</span>
          <span>C:{Math.round(meal.food.macros.carbs * meal.servings)}g</span>
          <span>F:{Math.round(meal.food.macros.fats * meal.servings)}g</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-300">{calories}</span>
        <button
          onClick={() => onDelete(meal.id)}
          className="p-1 text-gray-500 hover:text-red-400 transition-all md:opacity-0 md:group-hover:opacity-100"
          aria-label={`Delete ${meal.food.name}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
