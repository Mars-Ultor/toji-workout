import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { db, storage } from './firebase';
import type { BodyMetrics } from '../types/user.types';

export async function logBodyMetrics(userId: string, metrics: BodyMetrics) {
  const docRef = doc(db, 'users', userId, 'bodyMetrics', metrics.date);
  await setDoc(docRef, metrics, { merge: true });
}

export async function getBodyMetricsHistory(
  userId: string,
  limitCount: number = 30
): Promise<BodyMetrics[]> {
  const q = query(
    collection(db, 'users', userId, 'bodyMetrics'),
    orderBy('date', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as BodyMetrics);
}

export async function uploadProgressPhoto(
  userId: string,
  file: File,
  date: string
): Promise<string> {
  // Validate file type and size on client
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size must be under 10MB');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  const storageRef = ref(storage, `users/${userId}/progress-photos/${date}/${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function getProgressPhotos(userId: string): Promise<string[]> {
  try {
    const listRef = ref(storage, `users/${userId}/progress-photos`);
    const result = await listAll(listRef);
    // List all items in subdirectories
    const urls: string[] = [];
    for (const prefix of result.prefixes) {
      const subResult = await listAll(prefix);
      for (const item of subResult.items) {
        const url = await getDownloadURL(item);
        urls.push(url);
      }
    }
    return urls;
  } catch {
    return [];
  }
}
