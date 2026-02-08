import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import type { Recipe, Food } from '../types/nutrition.types';

/**
 * Calculate macros per serving for a recipe based on its ingredients
 */
function calculateMacrosPerServing(recipe: Omit<Recipe, 'macrosPerServing'>): Recipe['macrosPerServing'] {
  const totals = recipe.ingredients.reduce(
    (acc, ingredient) => ({
      calories: acc.calories + ingredient.food.macros.calories * ingredient.servings,
      protein: acc.protein + ingredient.food.macros.protein * ingredient.servings,
      carbs: acc.carbs + ingredient.food.macros.carbs * ingredient.servings,
      fats: acc.fats + ingredient.food.macros.fats * ingredient.servings,
      fiber: acc.fiber + (ingredient.food.macros.fiber || 0) * ingredient.servings,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
  );

  const servings = recipe.servingsCount || 1;
  return {
    calories: Math.round(totals.calories / servings),
    protein: Math.round((totals.protein / servings) * 10) / 10,
    carbs: Math.round((totals.carbs / servings) * 10) / 10,
    fats: Math.round((totals.fats / servings) * 10) / 10,
    fiber: Math.round((totals.fiber / servings) * 10) / 10,
  };
}

/**
 * Save a recipe (create or update)
 */
export async function saveRecipe(userId: string, recipe: Recipe): Promise<void> {
  const recipeWithMacros = {
    ...recipe,
    macrosPerServing: calculateMacrosPerServing(recipe),
    updatedAt: new Date(),
  };

  const docRef = doc(db, `customRecipes/${userId}/recipes`, recipe.id);
  await setDoc(docRef, recipeWithMacros);
}

/**
 * Get all recipes for a user
 */
export async function getRecipes(userId: string): Promise<Recipe[]> {
  const q = query(
    collection(db, `customRecipes/${userId}/recipes`),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Recipe[];
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(userId: string, recipeId: string): Promise<void> {
  await deleteDoc(doc(db, `customRecipes/${userId}/recipes`, recipeId));
}

/**
 * Convert a recipe to a Food object that can be logged
 */
export function recipeToFood(recipe: Recipe): Food {
  return {
    id: `recipe-${recipe.id}`,
    name: recipe.name,
    brand: recipe.description ? `Recipe - ${recipe.description}` : 'Recipe',
    servingSize: 1,
    servingUnit: 'serving',
    macros: {
      calories: recipe.macrosPerServing.calories,
      protein: recipe.macrosPerServing.protein,
      carbs: recipe.macrosPerServing.carbs,
      fats: recipe.macrosPerServing.fats,
      fiber: recipe.macrosPerServing.fiber > 0 ? recipe.macrosPerServing.fiber : undefined,
    },
    verified: false,
  };
}
