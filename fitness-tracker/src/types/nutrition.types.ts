export interface Food {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  servingSize: number;
  servingUnit: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber?: number;
  };
  verified: boolean;
}

export interface MealEntry {
  id: string;
  foodId: string;
  food: Food;
  servings: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: Date;
}

export interface DailyNutrition {
  date: string;
  meals: MealEntry[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  calculatedTDEE?: number;
  lastAdjusted?: Date;
}

export interface RecipeIngredient {
  foodId: string;
  food: Food;
  servings: number;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
  servingsCount: number; // How many servings the recipe makes
  macrosPerServing: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}
