import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Food } from '../types/nutrition.types';

// --- Custom foods (per-user) ---
export async function saveCustomFood(userId: string, food: Food): Promise<void> {
  const docRef = doc(db, `customFoods/${userId}/foods`, food.id);
  await setDoc(docRef, food);
}

export async function getCustomFoods(userId: string): Promise<Food[]> {
  const q = query(
    collection(db, `customFoods/${userId}/foods`),
    orderBy('name')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Food));
}

export async function deleteCustomFood(userId: string, foodId: string): Promise<void> {
  await deleteDoc(doc(db, `customFoods/${userId}/foods`, foodId));
}

// --- Public food database ---
export async function getPublicFoods(): Promise<Food[]> {
  const q = query(collection(db, 'foods'), orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Food));
}

/**
 * Default food database used as a fallback when the public Firestore
 * collection is empty, and also used for initial seeding.
 */
export const DEFAULT_FOODS: Food[] = [
  { id: 'f1', name: 'Chicken Breast (grilled)', servingSize: 100, servingUnit: 'g', macros: { calories: 165, protein: 31, carbs: 0, fats: 3.6 }, verified: true },
  { id: 'f2', name: 'Brown Rice (cooked)', servingSize: 100, servingUnit: 'g', macros: { calories: 123, protein: 2.7, carbs: 25.6, fats: 1 }, verified: true },
  { id: 'f3', name: 'Egg (large)', servingSize: 50, servingUnit: 'g', macros: { calories: 72, protein: 6.3, carbs: 0.4, fats: 4.8 }, verified: true },
  { id: 'f4', name: 'Banana', servingSize: 118, servingUnit: 'g', macros: { calories: 105, protein: 1.3, carbs: 27, fats: 0.4 }, verified: true },
  { id: 'f5', name: 'Greek Yogurt', servingSize: 170, servingUnit: 'g', macros: { calories: 100, protein: 17, carbs: 6, fats: 0.7 }, verified: true },
  { id: 'f6', name: 'Oatmeal (dry)', servingSize: 40, servingUnit: 'g', macros: { calories: 150, protein: 5, carbs: 27, fats: 3, fiber: 4 }, verified: true },
  { id: 'f7', name: 'Salmon (baked)', servingSize: 100, servingUnit: 'g', macros: { calories: 208, protein: 20, carbs: 0, fats: 13 }, verified: true },
  { id: 'f8', name: 'Sweet Potato (baked)', servingSize: 100, servingUnit: 'g', macros: { calories: 90, protein: 2, carbs: 21, fats: 0.1 }, verified: true },
  { id: 'f9', name: 'Broccoli (steamed)', servingSize: 100, servingUnit: 'g', macros: { calories: 35, protein: 2.4, carbs: 7, fats: 0.4, fiber: 3.3 }, verified: true },
  { id: 'f10', name: 'Almonds', servingSize: 28, servingUnit: 'g', macros: { calories: 164, protein: 6, carbs: 6, fats: 14, fiber: 3.5 }, verified: true },
  { id: 'f11', name: 'Whey Protein Scoop', servingSize: 31, servingUnit: 'g', macros: { calories: 120, protein: 24, carbs: 3, fats: 1.5 }, verified: true },
  { id: 'f12', name: 'Avocado (half)', servingSize: 68, servingUnit: 'g', macros: { calories: 114, protein: 1.3, carbs: 6, fats: 10.5, fiber: 4.6 }, verified: true },
  { id: 'f13', name: 'White Rice (cooked)', servingSize: 100, servingUnit: 'g', macros: { calories: 130, protein: 2.7, carbs: 28, fats: 0.3 }, verified: true },
  { id: 'f14', name: 'Peanut Butter', servingSize: 32, servingUnit: 'g', macros: { calories: 188, protein: 8, carbs: 6, fats: 16, fiber: 2 }, verified: true },
  { id: 'f15', name: 'Whole Wheat Bread', servingSize: 28, servingUnit: 'g', macros: { calories: 69, protein: 3.6, carbs: 12, fats: 1.1, fiber: 1.9 }, verified: true },
  { id: 'f16', name: 'Olive Oil', servingSize: 14, servingUnit: 'ml', macros: { calories: 119, protein: 0, carbs: 0, fats: 13.5 }, verified: true },
  { id: 'f17', name: 'Turkey Breast (sliced)', servingSize: 56, servingUnit: 'g', macros: { calories: 60, protein: 12, carbs: 2, fats: 0.5 }, verified: true },
  { id: 'f18', name: 'Cottage Cheese (2%)', servingSize: 113, servingUnit: 'g', macros: { calories: 90, protein: 12, carbs: 5, fats: 2.5 }, verified: true },
  { id: 'f19', name: 'Tuna (canned in water)', servingSize: 85, servingUnit: 'g', macros: { calories: 73, protein: 17, carbs: 0, fats: 0.5 }, verified: true },
  { id: 'f20', name: 'Spinach (raw)', servingSize: 30, servingUnit: 'g', macros: { calories: 7, protein: 0.9, carbs: 1.1, fats: 0.1, fiber: 0.7 }, verified: true },
  { id: 'f21', name: 'Apple (medium)', servingSize: 182, servingUnit: 'g', macros: { calories: 95, protein: 0.5, carbs: 25, fats: 0.3, fiber: 4.4 }, verified: true },
  { id: 'f22', name: 'Cheddar Cheese', servingSize: 28, servingUnit: 'g', macros: { calories: 113, protein: 7, carbs: 0.4, fats: 9.3 }, verified: true },
  { id: 'f23', name: 'Beef (ground, 90% lean)', servingSize: 113, servingUnit: 'g', macros: { calories: 200, protein: 22, carbs: 0, fats: 11 }, verified: true },
  { id: 'f24', name: 'Black Beans (cooked)', servingSize: 86, servingUnit: 'g', macros: { calories: 114, protein: 7.6, carbs: 20, fats: 0.5, fiber: 7.5 }, verified: true },
  { id: 'f25', name: 'Honey', servingSize: 21, servingUnit: 'g', macros: { calories: 64, protein: 0.1, carbs: 17, fats: 0 }, verified: true },
  { id: 'f26', name: 'Whole Milk', servingSize: 244, servingUnit: 'ml', macros: { calories: 149, protein: 8, carbs: 12, fats: 8 }, verified: true },
  { id: 'f27', name: 'Pasta (cooked)', servingSize: 140, servingUnit: 'g', macros: { calories: 220, protein: 8, carbs: 43, fats: 1.3 }, verified: true },
  { id: 'f28', name: 'Blueberries', servingSize: 148, servingUnit: 'g', macros: { calories: 84, protein: 1.1, carbs: 21, fats: 0.5, fiber: 3.6 }, verified: true },
  { id: 'f29', name: 'Tofu (firm)', servingSize: 126, servingUnit: 'g', macros: { calories: 144, protein: 17, carbs: 3, fats: 8 }, verified: true },
  { id: 'f30', name: 'Quinoa (cooked)', servingSize: 185, servingUnit: 'g', macros: { calories: 222, protein: 8, carbs: 39, fats: 3.5, fiber: 5 }, verified: true },
];

/**
 * Seed the public foods collection in Firestore with the default food database.
 * This is idempotent — existing docs with the same ID will be overwritten.
 */
export async function seedPublicFoods(): Promise<void> {
  const batch = writeBatch(db);
  for (const food of DEFAULT_FOODS) {
    const docRef = doc(db, 'foods', food.id);
    batch.set(docRef, food);
  }
  await batch.commit();
}
