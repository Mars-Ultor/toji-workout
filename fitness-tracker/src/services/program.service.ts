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

export interface SavedProgramExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string[];
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
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

export async function saveProgram(userId: string, program: SavedProgram): Promise<void> {
  const docRef = doc(db, `programs/${userId}/list`, program.id);
  await setDoc(docRef, program);
}

export async function getPrograms(userId: string): Promise<SavedProgram[]> {
  const q = query(
    collection(db, `programs/${userId}/list`),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as SavedProgram[];
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
  const batch: Promise<void>[] = allPrograms.map((p) =>
    setDoc(doc(db, `programs/${userId}/list`, p.id), { ...p, isActive: p.id === programId }, { merge: true })
  );
  await Promise.all(batch);
}
