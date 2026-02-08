import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Workout, Exercise } from '../types/workout.types';

export async function logWorkout(
  userId: string,
  workout: Omit<Workout, 'id' | 'userId'>
): Promise<string> {
  const docRef = await addDoc(collection(db, `workoutLogs/${userId}/sessions`), {
    ...workout,
    userId,
    date: new Date(),
  });
  return docRef.id;
}

export async function deleteWorkout(userId: string, workoutId: string) {
  await deleteDoc(doc(db, `workoutLogs/${userId}/sessions`, workoutId));
}

export async function getWorkoutHistory(
  userId: string,
  limitCount: number = 20
): Promise<Workout[]> {
  const q = query(
    collection(db, `workoutLogs/${userId}/sessions`),
    orderBy('date', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Workout[];
}

export function subscribeToWorkoutHistory(
  userId: string,
  limitCount: number,
  callback: (workouts: Workout[]) => void
): Unsubscribe {
  const q = query(
    collection(db, `workoutLogs/${userId}/sessions`),
    orderBy('date', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const workouts = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Workout[];
      callback(workouts);
    },
    (error) => {
      console.error('Workout history snapshot error:', error);
      callback([]);
    }
  );
}

export async function getExercises(): Promise<Exercise[]> {
  const snapshot = await getDocs(collection(db, 'exercises'));
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Exercise[];
}
