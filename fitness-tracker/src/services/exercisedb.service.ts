/**
 * ExerciseDB API Service
 * https://rapidapi.com/ascendapi/api/edb-with-videos-and-images-by-ascendapi
 *
 * Terms: real-time access only, no persistent storage, max 1-hour in-memory cache.
 */

import type { Exercise } from '../types/workout.types';

// ── API types ──────────────────────────────────────────────────────────────

export interface ApiExercise {
  exerciseId: string;
  name: string;
  imageUrl: string;
  bodyParts: string[];      // e.g. ["CHEST"]
  equipments: string[];     // e.g. ["BARBELL"]
  exerciseType: string;     // STRENGTH | CARDIO | PLYOMETRICS | STRETCHING | WEIGHTLIFTING | YOGA | AEROBIC
  targetMuscles: string[];  // e.g. ["PECTORALIS MAJOR STERNAL HEAD"]
  secondaryMuscles: string[];
  keywords: string[];
}

interface ApiResponse<T> {
  success: boolean;
  meta?: { total: number; hasNextPage: boolean; nextCursor?: string };
  data: T;
}

interface EquipmentItem {
  name: string;
  imageUrl: string;
}

interface BodyPartItem {
  name: string;
  imageUrl: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}/api/v1`;
const CACHE_TTL = 55 * 60 * 1000; // 55 minutes (under the 1-hour limit)

// ── Mappings: API UPPERCASE → App title case ───────────────────────────────

/** Map API body parts to our muscle group names */
const BODY_PART_TO_MUSCLE: Record<string, string> = {
  'CHEST': 'Chest',
  'BACK': 'Back',
  'SHOULDERS': 'Shoulders',
  'BICEPS': 'Biceps',
  'TRICEPS': 'Triceps',
  'UPPER ARMS': 'Biceps',
  'FOREARMS': 'Forearms',
  'THIGHS': 'Quads',
  'QUADRICEPS': 'Quads',
  'HAMSTRINGS': 'Hamstrings',
  'HIPS': 'Glutes',
  'CALVES': 'Calves',
  'WAIST': 'Core',
  'NECK': 'Shoulders',
  'FULL BODY': 'Full Body',
  'HANDS': 'Forearms',
  'FEET': 'Calves',
  'FACE': 'Core',
};

/** Map API target muscles to our simplified muscle groups */
const TARGET_MUSCLE_TO_GROUP: Record<string, string> = {
  'PECTORALIS MAJOR STERNAL HEAD': 'Chest',
  'PECTORALIS MAJOR CLAVICULAR HEAD': 'Chest',
  'ANTERIOR DELTOID': 'Shoulders',
  'LATERAL DELTOID': 'Shoulders',
  'POSTERIOR DELTOID': 'Shoulders',
  'LATISSIMUS DORSI': 'Back',
  'TRAPEZIUS LOWER FIBERS': 'Back',
  'TRAPEZIUS MIDDLE FIBERS': 'Back',
  'TRAPEZIUS UPPER FIBERS': 'Back',
  'ERECTOR SPINAE': 'Back',
  'TERES MAJOR': 'Back',
  'TERES MINOR': 'Back',
  'INFRASPINATUS': 'Back',
  'SUBSCAPULARIS': 'Back',
  'LEVATOR SCAPULAE': 'Back',
  'BICEPS BRACHII': 'Biceps',
  'BRACHIALIS': 'Biceps',
  'BRACHIORADIALIS': 'Forearms',
  'TRICEPS BRACHII': 'Triceps',
  'WRIST FLEXORS': 'Forearms',
  'WRIST EXTENSORS': 'Forearms',
  'QUADRICEPS': 'Quads',
  'HAMSTRINGS': 'Hamstrings',
  'GLUTEUS MAXIMUS': 'Glutes',
  'GLUTEUS MEDIUS': 'Glutes',
  'GLUTEUS MINIMUS': 'Glutes',
  'ADDUCTOR LONGUS': 'Glutes',
  'ADDUCTOR BREVIS': 'Glutes',
  'ADDUCTOR MAGNUS': 'Glutes',
  'GASTROCNEMIUS': 'Calves',
  'SOLEUS': 'Calves',
  'TIBIALIS ANTERIOR': 'Calves',
  'RECTUS ABDOMINIS': 'Core',
  'OBLIQUES': 'Core',
  'TRANSVERSUS ABDOMINIS': 'Core',
  'ILIOPSOAS': 'Core',
  'SERRATUS ANTERIOR': 'Core',
  'SERRATUS ANTE': 'Core',
  'TENSOR FASCIAE LATAE': 'Glutes',
  'PECTINEUS': 'Glutes',
  'GRACILIS': 'Glutes',
  'SARTORIUS': 'Quads',
  'POPLITEUS': 'Hamstrings',
  'STERNOCLEIDOMASTOID': 'Core',
  'SPLENIUS': 'Back',
  'DEEP HIP EXTERNAL ROTATORS': 'Glutes',
};

/** Map API equipment names to our app display names */
const EQUIPMENT_MAP: Record<string, string> = {
  'ASSISTED': 'Assisted',
  'BAND': 'Resistance Band',
  'BARBELL': 'Barbell',
  'BATTLING ROPE': 'Battle Rope',
  'BODY WEIGHT': 'Bodyweight',
  'BOSU BALL': 'Bosu Ball',
  'CABLE': 'Cable',
  'DUMBBELL': 'Dumbbell',
  'EZ BARBELL': 'EZ Bar',
  'HAMMER': 'Hammer',
  'KETTLEBELL': 'Kettlebell',
  'LEVERAGE MACHINE': 'Machine',
  'MEDICINE BALL': 'Medicine Ball',
  'OLYMPIC BARBELL': 'Barbell',
  'POWER SLED': 'Sled',
  'RESISTANCE BAND': 'Resistance Band',
  'ROLL': 'Foam Roller',
  'ROLLBALL': 'Roll Ball',
  'ROPE': 'Rope',
  'SLED MACHINE': 'Sled',
  'SMITH MACHINE': 'Smith Machine',
  'STABILITY BALL': 'Stability Ball',
  'STICK': 'Stick',
  'SUSPENSION': 'Suspension',
  'TRAP BAR': 'Trap Bar',
  'VIBRATE PLATE': 'Vibrate Plate',
  'WEIGHTED': 'Weighted',
  'WHEEL ROLLER': 'Ab Wheel',
};

/** Reverse mapping: our equipment name → API UPPERCASE names (exported for potential future use) */
export function appEquipmentToApi(appEquip: string): string[] {
  const results: string[] = [];
  for (const [apiName, appName] of Object.entries(EQUIPMENT_MAP)) {
    if (appName === appEquip) results.push(apiName);
  }
  return results.length > 0 ? results : [appEquip.toUpperCase()];
}

// ── In-memory cache ────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheEntry<unknown>> = {};

function getCached<T>(key: string): T | null {
  const entry = cache[key] as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    delete cache[key];
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  cache[key] = { data, timestamp: Date.now() };
}

// ── API fetch helper ───────────────────────────────────────────────────────

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    throw new Error(`ExerciseDB API error: ${response.status} ${response.statusText}`);
  }

  const json: ApiResponse<T> = await response.json();
  if (!json.success) {
    throw new Error('ExerciseDB API returned unsuccessful response');
  }
  return json.data;
}

// ── Conversion: API → App Exercise ─────────────────────────────────────────

function inferCategory(apiEx: ApiExercise): Exercise['category'] {
  const type = apiEx.exerciseType.toUpperCase();
  if (type === 'CARDIO' || type === 'AEROBIC') return 'cardio';

  // If exercise targets multiple distinct major muscle groups → compound
  const groups = new Set<string>();
  for (const m of apiEx.targetMuscles) {
    const g = TARGET_MUSCLE_TO_GROUP[m];
    if (g) groups.add(g);
  }
  // Also count body parts
  for (const bp of apiEx.bodyParts) {
    const g = BODY_PART_TO_MUSCLE[bp];
    if (g) groups.add(g);
  }

  return groups.size >= 2 ? 'compound' : 'isolation';
}

function inferDifficulty(apiEx: ApiExercise): Exercise['difficulty'] {
  // Heuristic: plyometrics/weightlifting → advanced, stretching/yoga → beginner, rest → intermediate
  const type = apiEx.exerciseType.toUpperCase();
  if (type === 'STRETCHING' || type === 'YOGA') return 'beginner';
  if (type === 'PLYOMETRICS' || type === 'WEIGHTLIFTING') return 'advanced';

  // Multi-joint barbell movements tend to be intermediate+
  const hasBarbell = apiEx.equipments.some(e => e.includes('BARBELL'));
  const isCompound = inferCategory(apiEx) === 'compound';
  if (hasBarbell && isCompound) return 'intermediate';

  return 'beginner';
}

function getMuscleGroups(apiEx: ApiExercise): string[] {
  const groups = new Set<string>();

  // From body parts
  for (const bp of apiEx.bodyParts) {
    const g = BODY_PART_TO_MUSCLE[bp];
    if (g) groups.add(g);
  }

  // From target muscles
  for (const m of apiEx.targetMuscles) {
    const g = TARGET_MUSCLE_TO_GROUP[m];
    if (g) groups.add(g);
  }

  return groups.size > 0 ? Array.from(groups) : ['Full Body'];
}

function getEquipment(apiEx: ApiExercise): string[] {
  const mapped = apiEx.equipments.map(e => EQUIPMENT_MAP[e] || e);
  return [...new Set(mapped)];
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function apiToExercise(apiEx: ApiExercise): Exercise {
  return {
    id: apiEx.exerciseId,
    name: titleCase(apiEx.name),
    category: inferCategory(apiEx),
    muscleGroup: getMuscleGroups(apiEx),
    equipment: getEquipment(apiEx),
    difficulty: inferDifficulty(apiEx),
    imageUrl: apiEx.imageUrl || undefined,
    secondaryMuscles: apiEx.secondaryMuscles?.map(m => TARGET_MUSCLE_TO_GROUP[m] || titleCase(m)),
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Fetch all exercises (paginated internally). Results are cached for 55 min.
 */
export async function fetchAllExercises(): Promise<Exercise[]> {
  const cacheKey = 'all-exercises';
  const cached = getCached<Exercise[]>(cacheKey);
  if (cached) return cached;

  const allApiExercises: ApiExercise[] = [];
  let offset = 0;
  const limit = 100;

  // Paginate through all exercises
  while (true) {
    const url = new URL(`${BASE_URL}/exercises`);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) throw new Error(`ExerciseDB API error: ${response.status}`);
    const json: ApiResponse<ApiExercise[]> = await response.json();
    if (!json.success) break;

    allApiExercises.push(...json.data);

    if (!json.meta?.hasNextPage) break;
    offset += limit;
  }

  const exercises = allApiExercises.map(apiToExercise);
  setCache(cacheKey, exercises);
  return exercises;
}

/**
 * Get a single exercise by ID.
 */
export async function getExerciseById(exerciseId: string): Promise<Exercise | null> {
  // Check all-exercises cache first
  const allCached = getCached<Exercise[]>('all-exercises');
  if (allCached) {
    const found = allCached.find(e => e.id === exerciseId);
    if (found) return found;
  }

  const cacheKey = `exercise-${exerciseId}`;
  const cached = getCached<Exercise>(cacheKey);
  if (cached) return cached;

  try {
    const data = await apiFetch<ApiExercise>(`/exercises/${exerciseId}`);
    const exercise = apiToExercise(data);
    setCache(cacheKey, exercise);
    return exercise;
  } catch {
    return null;
  }
}

/**
 * Search exercises by name text. Filters from the cached full list.
 */
export async function searchExercises(query: string): Promise<Exercise[]> {
  const all = await fetchAllExercises();
  const q = query.toLowerCase().trim();
  if (!q) return all;

  return all.filter(ex =>
    ex.name.toLowerCase().includes(q) ||
    ex.muscleGroup.some(mg => mg.toLowerCase().includes(q)) ||
    ex.equipment.some(eq => eq.toLowerCase().includes(q))
  );
}

/**
 * Get exercises filtered by equipment (app names, e.g. "Barbell", "Bodyweight").
 */
export async function getExercisesByEquipment(equipmentNames: string[]): Promise<Exercise[]> {
  const all = await fetchAllExercises();
  return all.filter(ex =>
    ex.equipment.some(eq => equipmentNames.includes(eq))
  );
}

/**
 * Get exercises filtered by muscle group (app names, e.g. "Chest", "Back").
 */
export async function getExercisesByMuscleGroup(muscleGroups: string[]): Promise<Exercise[]> {
  const all = await fetchAllExercises();
  return all.filter(ex =>
    ex.muscleGroup.some(mg => muscleGroups.includes(mg))
  );
}

/**
 * Get exercises filtered by both equipment and muscle group.
 */
export async function getExercisesFiltered(
  equipmentNames: string[],
  muscleGroups: string[]
): Promise<Exercise[]> {
  const all = await fetchAllExercises();
  return all.filter(ex =>
    ex.equipment.some(eq => equipmentNames.includes(eq)) &&
    ex.muscleGroup.some(mg => muscleGroups.includes(mg))
  );
}

/**
 * Fetch the list of available equipment from the API.
 * Returns app-friendly names (title case, deduplicated).
 */
export async function fetchEquipmentList(): Promise<string[]> {
  const cacheKey = 'equipment-list';
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  const data = await apiFetch<EquipmentItem[]>('/equipments');
  const names = [...new Set(data.map(e => EQUIPMENT_MAP[e.name] || titleCase(e.name)))];
  setCache(cacheKey, names);
  return names;
}

/**
 * Fetch the list of body parts from the API.
 */
export async function fetchBodyParts(): Promise<string[]> {
  const cacheKey = 'bodyparts-list';
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  const data = await apiFetch<BodyPartItem[]>('/bodyparts');
  const names = [...new Set(data.map(e => BODY_PART_TO_MUSCLE[e.name] || titleCase(e.name)))];
  setCache(cacheKey, names);
  return names;
}

// ── Equipment Presets ──────────────────────────────────────────────────────

export const EQUIPMENT_PRESETS: Record<string, { label: string; description: string; equipment: string[] }> = {
  bodyweight: {
    label: 'Bodyweight Only',
    description: 'No equipment needed. Train anywhere.',
    equipment: ['Bodyweight'],
  },
  homeBasic: {
    label: 'Home Gym (Basic)',
    description: 'Dumbbells, resistance bands, maybe a pull-up bar.',
    equipment: ['Bodyweight', 'Dumbbell', 'Resistance Band', 'Kettlebell'],
  },
  homeComplete: {
    label: 'Home Gym (Complete)',
    description: 'Barbell, dumbbells, bench, rack.',
    equipment: ['Bodyweight', 'Barbell', 'Dumbbell', 'Kettlebell', 'Resistance Band', 'EZ Bar'],
  },
  commercialGym: {
    label: 'Full Commercial Gym',
    description: 'Access to everything — barbells, cables, machines, etc.',
    equipment: [
      'Bodyweight', 'Barbell', 'Dumbbell', 'Cable', 'Machine',
      'Kettlebell', 'EZ Bar', 'Smith Machine', 'Resistance Band',
      'Trap Bar', 'Medicine Ball', 'Ab Wheel', 'Stability Ball',
      'Suspension', 'Sled',
    ],
  },
};

/**
 * Returns true if the API key is configured.
 */
export function isExerciseDbConfigured(): boolean {
  return !!RAPIDAPI_KEY;
}
