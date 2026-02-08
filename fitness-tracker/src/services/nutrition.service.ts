import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  query,
  getDocs,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { DailyNutrition, MealEntry, NutritionTargets } from '../types/nutrition.types';

export async function logMeal(
  userId: string,
  date: string,
  mealEntry: Omit<MealEntry, 'id'>
): Promise<string> {
  const docRef = await addDoc(collection(db, `foodLogs/${userId}/${date}`), {
    ...mealEntry,
    timestamp: new Date(),
  });
  return docRef.id;
}

export async function deleteMeal(userId: string, date: string, mealId: string) {
  await deleteDoc(doc(db, `foodLogs/${userId}/${date}`, mealId));
}

export async function getDailyNutrition(
  userId: string,
  date: string
): Promise<DailyNutrition | null> {
  const q = query(collection(db, `foodLogs/${userId}/${date}`));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const meals = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as MealEntry[];

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.food.macros.calories * meal.servings,
      protein: acc.protein + meal.food.macros.protein * meal.servings,
      carbs: acc.carbs + meal.food.macros.carbs * meal.servings,
      fats: acc.fats + meal.food.macros.fats * meal.servings,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return { date, meals, totals };
}

export function subscribeToDailyNutrition(
  userId: string,
  date: string,
  callback: (data: DailyNutrition | null) => void
): Unsubscribe {
  const q = query(collection(db, `foodLogs/${userId}/${date}`));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }

      const meals = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as MealEntry[];

      const totals = meals.reduce(
        (acc, meal) => ({
          calories: acc.calories + meal.food.macros.calories * meal.servings,
          protein: acc.protein + meal.food.macros.protein * meal.servings,
          carbs: acc.carbs + meal.food.macros.carbs * meal.servings,
          fats: acc.fats + meal.food.macros.fats * meal.servings,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

      callback({ date, meals, totals });
    },
    (error) => {
      console.error('Nutrition snapshot error:', error);
      callback(null);
    }
  );
}

export async function getNutritionTargets(
  userId: string
): Promise<NutritionTargets | null> {
  const docRef = doc(db, `nutritionTargets/${userId}`);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return docSnap.data() as NutritionTargets;
}

export async function updateNutritionTargets(
  userId: string,
  targets: NutritionTargets
) {
  const docRef = doc(db, `nutritionTargets/${userId}`);
  await setDoc(docRef, targets, { merge: true });
}
