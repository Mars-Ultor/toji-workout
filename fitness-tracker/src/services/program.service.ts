import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export interface SavedProgramExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string[];
  category?: 'compound' | 'isolation' | 'cardio' | 'warmup' | 'stretch'; // Optional for backward compatibility
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  duration?: number; // Duration in seconds for warmup/stretch exercises
}

export interface SavedProgramDay {
  name: string;
  exercises: SavedProgramExercise[];
}

export interface SavedProgram {
  id: string;
  name: string;
  description: string;
  days: SavedProgramDay[];
  createdBy: string;
  createdAt: Date;
  isActive?: boolean;
}

// Helper function to remove undefined values (Firestore doesn't accept undefined)
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as T;
  }
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanUndefined(value);
    }
  }
  return cleaned as T;
}

export async function saveProgram(userId: string, program: SavedProgram): Promise<void> {
  const docRef = doc(db, `programs/${userId}/list`, program.id);
  // Convert Date to Firestore Timestamp and remove undefined values
  const programData = cleanUndefined({
    ...program,
    createdAt: Timestamp.fromDate(program.createdAt),
  });
  await setDoc(docRef, programData);
}

export async function getPrograms(userId: string): Promise<SavedProgram[]> {
  const q = query(
    collection(db, `programs/${userId}/list`),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      // Convert Firestore Timestamp to Date
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    };
  }) as SavedProgram[];
}

export async function deleteProgram(userId: string, programId: string): Promise<void> {
  await deleteDoc(doc(db, `programs/${userId}/list`, programId));
}

export async function setActiveProgram(
  userId: string,
  programId: string,
  allPrograms: SavedProgram[]
): Promise<void> {
  // Deactivate all, then activate the selected one
  const batch: Promise<void>[] = allPrograms.map((p) => {
    const programData = cleanUndefined({
      ...p,
      createdAt: Timestamp.fromDate(p.createdAt),
      isActive: p.id === programId,
    });
    return setDoc(doc(db, `programs/${userId}/list`, p.id), programData, { merge: true });
  });
  await Promise.all(batch);
}
