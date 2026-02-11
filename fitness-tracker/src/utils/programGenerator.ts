import type { Exercise } from '../types/workout.types';
import {
  fetchAllExercises,
  isExerciseDbConfigured,
} from '../services/exercisedb.service';

/**
 * Wizard answers used to generate a workout program.
 */
export interface ProgramWizardAnswers {
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'general';
  experience: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  sessionLength: 'short' | 'medium' | 'long'; // 30-45, 45-60, 60-90 min
  equipment: string[];
  focusMuscles: string[]; // extra focus on these muscle groups
  split: 'full-body' | 'upper-lower' | 'push-pull-legs' | 'bro-split' | 'auto';
}

export interface GeneratedExercise {
  exercise: Exercise;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
}

export interface GeneratedDay {
  name: string;
  exercises: GeneratedExercise[];
}

export interface GeneratedProgram {
  name: string;
  description: string;
  days: GeneratedDay[];
}

// ── Hardcoded fallback exercise database ───────────────────────────────────
// Used when ExerciseDB API is unavailable or not configured.

const FALLBACK_EXERCISE_DB: Exercise[] = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', category: 'compound', muscleGroup: ['Chest', 'Triceps', 'Shoulders'], equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'incline-bench', name: 'Incline Bench Press', category: 'compound', muscleGroup: ['Chest', 'Shoulders'], equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'db-bench', name: 'Dumbbell Bench Press', category: 'compound', muscleGroup: ['Chest', 'Triceps'], equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'db-fly', name: 'Dumbbell Fly', category: 'isolation', muscleGroup: ['Chest'], equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'cable-crossover', name: 'Cable Crossover', category: 'isolation', muscleGroup: ['Chest'], equipment: ['Cable'], difficulty: 'beginner' },
  { id: 'push-ups', name: 'Push-ups', category: 'compound', muscleGroup: ['Chest', 'Triceps', 'Shoulders'], equipment: ['Bodyweight'], difficulty: 'beginner', progressionPath: { easier: 'incline-push-ups', harder: 'diamond-push-ups', alternatives: ['wide-push-ups', 'decline-push-ups'] } },
  { id: 'incline-push-ups', name: 'Incline Push-ups', category: 'compound', muscleGroup: ['Chest', 'Triceps'], equipment: ['Bodyweight'], difficulty: 'beginner', progressionPath: { harder: 'push-ups', alternatives: ['wall-push-ups', 'knee-push-ups'] } },
  { id: 'diamond-push-ups', name: 'Diamond Push-ups', category: 'compound', muscleGroup: ['Chest', 'Triceps'], equipment: ['Bodyweight'], difficulty: 'intermediate', progressionPath: { easier: 'push-ups', harder: 'one-arm-push-ups' } },
  { id: 'dips', name: 'Dips', category: 'compound', muscleGroup: ['Chest', 'Triceps'], equipment: ['Bodyweight'], difficulty: 'intermediate', progressionPath: { easier: 'bench-dips', harder: 'weighted-dips' } },
  { id: 'chest-press-machine', name: 'Chest Press Machine', category: 'compound', muscleGroup: ['Chest', 'Triceps'], equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'pec-deck', name: 'Pec Deck', category: 'isolation', muscleGroup: ['Chest'], equipment: ['Machine'], difficulty: 'beginner' },
  // Back
  { id: 'deadlift', name: 'Deadlift', category: 'compound', muscleGroup: ['Back', 'Hamstrings', 'Glutes'], equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'barbell-row', name: 'Barbell Row', category: 'compound', muscleGroup: ['Back', 'Biceps'], equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'db-row', name: 'Dumbbell Row', category: 'compound', muscleGroup: ['Back', 'Biceps'], equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'pull-ups', name: 'Pull-ups', category: 'compound', muscleGroup: ['Back', 'Biceps'], equipment: ['Bodyweight'], difficulty: 'intermediate', progressionPath: { easier: 'assisted-pull-ups', harder: 'weighted-pull-ups', alternatives: ['chin-ups', 'neutral-grip-pull-ups'] } },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'compound', muscleGroup: ['Back', 'Biceps'], equipment: ['Cable'], difficulty: 'beginner' },
  { id: 'cable-row', name: 'Cable Row', category: 'compound', muscleGroup: ['Back', 'Biceps'], equipment: ['Cable'], difficulty: 'beginner' },
  { id: 't-bar-row', name: 'T-Bar Row', category: 'compound', muscleGroup: ['Back'], equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'face-pull', name: 'Face Pull', category: 'isolation', muscleGroup: ['Shoulders', 'Back'], equipment: ['Cable'], difficulty: 'beginner' },
  // Shoulders
  { id: 'overhead-press', name: 'Overhead Press', category: 'compound', muscleGroup: ['Shoulders', 'Triceps'], equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', category: 'compound', muscleGroup: ['Shoulders', 'Triceps'], equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'lateral-raise', name: 'Lateral Raise', category: 'isolation', muscleGroup: ['Shoulders'], equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'front-raise', name: 'Front Raise', category: 'isolation', muscleGroup: ['Shoulders'], equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', category: 'isolation', muscleGroup: ['Shoulders'], equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'arnold-press', name: 'Arnold Press', category: 'compound', muscleGroup: ['Shoulders'], equipment: ['Dumbbell'], difficulty: 'intermediate' },
  // Legs
  { id: 'barbell-squat', name: 'Barbell Squat', category: 'compound', muscleGroup: ['Quads', 'Glutes', 'Hamstrings'], equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'front-squat', name: 'Front Squat', category: 'compound', muscleGroup: ['Quads', 'Glutes'], equipment: ['Barbell'], difficulty: 'advanced' },
  { id: 'leg-press', name: 'Leg Press', category: 'compound', muscleGroup: ['Quads', 'Glutes'], equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'lunges', name: 'Lunges', category: 'compound', muscleGroup: ['Quads', 'Glutes', 'Hamstrings'], equipment: ['Dumbbell', 'Bodyweight'], difficulty: 'beginner', progressionPath: { harder: 'jumping-lunges', alternatives: ['reverse-lunges', 'walking-lunges'] } },
  { id: 'bulgarian-split', name: 'Bulgarian Split Squat', category: 'compound', muscleGroup: ['Quads', 'Glutes'], equipment: ['Dumbbell'], difficulty: 'intermediate', progressionPath: { easier: 'lunges', harder: 'assisted-pistol-squats' } },
  { id: 'leg-extension', name: 'Leg Extension', category: 'isolation', muscleGroup: ['Quads'], equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'leg-curl', name: 'Leg Curl', category: 'isolation', muscleGroup: ['Hamstrings'], equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'rdl', name: 'Romanian Deadlift', category: 'compound', muscleGroup: ['Hamstrings', 'Glutes'], equipment: ['Barbell', 'Dumbbell'], difficulty: 'intermediate' },
  { id: 'hip-thrust', name: 'Hip Thrust', category: 'compound', muscleGroup: ['Glutes', 'Hamstrings'], equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'calf-raise', name: 'Calf Raise', category: 'isolation', muscleGroup: ['Calves'], equipment: ['Machine', 'Bodyweight'], difficulty: 'beginner' },
  { id: 'goblet-squat', name: 'Goblet Squat', category: 'compound', muscleGroup: ['Quads', 'Glutes'], equipment: ['Dumbbell', 'Kettlebell'], difficulty: 'beginner' },
  { id: 'bodyweight-squat', name: 'Bodyweight Squat', category: 'compound', muscleGroup: ['Quads', 'Glutes', 'Hamstrings'], equipment: ['Bodyweight'], difficulty: 'beginner', progressionPath: { harder: 'jump-squats', alternatives: ['goblet-squat', 'sumo-squat'] } },
  // Arms
  { id: 'bicep-curl', name: 'Bicep Curl', category: 'isolation', muscleGroup: ['Biceps'], equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'barbell-curl', name: 'Barbell Curl', category: 'isolation', muscleGroup: ['Biceps'], equipment: ['Barbell'], difficulty: 'beginner' },
  { id: 'hammer-curl', name: 'Hammer Curl', category: 'isolation', muscleGroup: ['Biceps', 'Forearms'], equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'cable-curl', name: 'Cable Curl', category: 'isolation', muscleGroup: ['Biceps'], equipment: ['Cable'], difficulty: 'beginner' },
  { id: 'tricep-extension', name: 'Tricep Extension', category: 'isolation', muscleGroup: ['Triceps'], equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'isolation', muscleGroup: ['Triceps'], equipment: ['Cable'], difficulty: 'beginner' },
  { id: 'skullcrusher', name: 'Skull Crushers', category: 'isolation', muscleGroup: ['Triceps'], equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'close-grip-bench', name: 'Close-Grip Bench Press', category: 'compound', muscleGroup: ['Triceps', 'Chest'], equipment: ['Barbell'], difficulty: 'intermediate' },
  // Core
  { id: 'plank', name: 'Plank', category: 'isolation', muscleGroup: ['Core'], equipment: ['Bodyweight'], difficulty: 'beginner', isTimed: true, duration: 30, progressionPath: { easier: 'knee-plank', harder: 'weighted-plank', alternatives: ['side-plank', 'plank-to-push-up'] } },
  { id: 'side-plank', name: 'Side Plank', category: 'isolation', muscleGroup: ['Core'], equipment: ['Bodyweight'], difficulty: 'intermediate', isTimed: true, duration: 30, progressionPath: { easier: 'plank' } },
  { id: 'crunches', name: 'Crunches', category: 'isolation', muscleGroup: ['Core'], equipment: ['Bodyweight'], difficulty: 'beginner' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', category: 'isolation', muscleGroup: ['Core'], equipment: ['Bodyweight'], difficulty: 'intermediate', progressionPath: { easier: 'knee-raises', harder: 'toes-to-bar' } },
  { id: 'cable-woodchop', name: 'Cable Woodchop', category: 'isolation', muscleGroup: ['Core'], equipment: ['Cable'], difficulty: 'beginner' },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', category: 'isolation', muscleGroup: ['Core'], equipment: ['Bodyweight'], difficulty: 'intermediate' },
  { id: 'russian-twist', name: 'Russian Twist', category: 'isolation', muscleGroup: ['Core'], equipment: ['Bodyweight'], difficulty: 'beginner' },
  { id: 'dead-bug', name: 'Dead Bug', category: 'isolation', muscleGroup: ['Core'], equipment: ['Bodyweight'], difficulty: 'beginner', isTimed: true, duration: 45 },
  { id: 'hollow-hold', name: 'Hollow Hold', category: 'isolation', muscleGroup: ['Core'], equipment: ['Bodyweight'], difficulty: 'intermediate', isTimed: true, duration: 30 },
  // Warmup
  { id: 'jumping-jacks', name: 'Jumping Jacks', category: 'warmup', muscleGroup: ['Full Body'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 60 },
  { id: 'arm-circles', name: 'Arm Circles', category: 'warmup', muscleGroup: ['Shoulders'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'leg-swings', name: 'Leg Swings', category: 'warmup', muscleGroup: ['Hamstrings', 'Quads'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'hip-circles', name: 'Hip Circles', category: 'warmup', muscleGroup: ['Glutes'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'torso-twists', name: 'Torso Twists', category: 'warmup', muscleGroup: ['Core'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'high-knees', name: 'High Knees', category: 'warmup', muscleGroup: ['Quads', 'Core'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'butt-kicks', name: 'Butt Kicks', category: 'warmup', muscleGroup: ['Hamstrings'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'inchworms', name: 'Inchworms', category: 'warmup', muscleGroup: ['Full Body'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 60 },
  // Stretches
  { id: 'quad-stretch', name: 'Quad Stretch', category: 'stretch', muscleGroup: ['Quads'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'hamstring-stretch', name: 'Hamstring Stretch', category: 'stretch', muscleGroup: ['Hamstrings'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'calf-stretch', name: 'Calf Stretch', category: 'stretch', muscleGroup: ['Calves'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'hip-flexor-stretch', name: 'Hip Flexor Stretch', category: 'stretch', muscleGroup: ['Glutes'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'chest-stretch', name: 'Chest Stretch', category: 'stretch', muscleGroup: ['Chest'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'shoulder-stretch', name: 'Shoulder Stretch', category: 'stretch', muscleGroup: ['Shoulders'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'tricep-stretch', name: 'Tricep Stretch', category: 'stretch', muscleGroup: ['Triceps'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'cat-cow', name: 'Cat-Cow Stretch', category: 'stretch', muscleGroup: ['Back', 'Core'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 60 },
  { id: 'childs-pose', name: "Child's Pose", category: 'stretch', muscleGroup: ['Back', 'Shoulders'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 60 },
  { id: 'pigeon-pose', name: 'Pigeon Pose', category: 'stretch', muscleGroup: ['Glutes', 'Hamstrings'], equipment: ['Bodyweight'], difficulty: 'intermediate', duration: 60 },
  { id: 'cobra-stretch', name: 'Cobra Stretch', category: 'stretch', muscleGroup: ['Back', 'Core'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
  { id: 'seated-spinal-twist', name: 'Seated Spinal Twist', category: 'stretch', muscleGroup: ['Back', 'Core'], equipment: ['Bodyweight'], difficulty: 'beginner', duration: 30 },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function filterByEquipment(exercises: Exercise[], equipment: string[]): Exercise[] {
  return exercises.filter((ex) =>
    ex.equipment.some((eq) => equipment.includes(eq))
  );
}

function filterByDifficulty(exercises: Exercise[], level: 'beginner' | 'intermediate' | 'advanced'): Exercise[] {
  const allowed: Record<string, string[]> = {
    beginner: ['beginner'],
    intermediate: ['beginner', 'intermediate'],
    advanced: ['beginner', 'intermediate', 'advanced'],
  };
  return exercises.filter((ex) => allowed[level].includes(ex.difficulty));
}

function filterByMuscle(exercises: Exercise[], muscles: string[]): Exercise[] {
  return exercises.filter((ex) =>
    ex.muscleGroup.some((mg) => muscles.includes(mg))
  );
}

function pickBest(
  pool: Exercise[],
  muscles: string[],
  count: number,
  preferCompound: boolean
): Exercise[] {
  const matching = filterByMuscle(pool, muscles);
  if (matching.length === 0) return [];

  // Sort: compounds first if preferred, then by how many target muscles match
  const sorted = [...matching].sort((a, b) => {
    if (preferCompound) {
      const aComp = a.category === 'compound' ? 1 : 0;
      const bComp = b.category === 'compound' ? 1 : 0;
      if (bComp !== aComp) return bComp - aComp;
    }
    const aMatch = a.muscleGroup.filter((m) => muscles.includes(m)).length;
    const bMatch = b.muscleGroup.filter((m) => muscles.includes(m)).length;
    return bMatch - aMatch;
  });

  // Pick ensuring variety (don't pick two of the exact same muscle group pattern)
  const picked: Exercise[] = [];
  const usedIds = new Set<string>();
  for (const ex of sorted) {
    if (picked.length >= count) break;
    if (usedIds.has(ex.id)) continue;
    usedIds.add(ex.id);
    picked.push(ex);
  }
  return picked;
}

// ── Set/rep/rest schemes based on goal ─────────────────────────────────────

function getScheme(
  goal: ProgramWizardAnswers['goal'],
  category: Exercise['category']
): { sets: number; repsMin: number; repsMax: number; restSeconds: number } {
  // Warmup and stretch exercises use duration, not traditional sets/reps
  if (category === 'warmup' || category === 'stretch') {
    return { sets: 1, repsMin: 1, repsMax: 1, restSeconds: 0 };
  }
  
  if (goal === 'strength') {
    return category === 'compound'
      ? { sets: 5, repsMin: 3, repsMax: 5, restSeconds: 180 }
      : { sets: 3, repsMin: 6, repsMax: 8, restSeconds: 120 };
  }
  if (goal === 'hypertrophy') {
    return category === 'compound'
      ? { sets: 4, repsMin: 8, repsMax: 12, restSeconds: 120 }
      : { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 90 };
  }
  if (goal === 'endurance') {
    return category === 'compound'
      ? { sets: 3, repsMin: 15, repsMax: 20, restSeconds: 60 }
      : { sets: 3, repsMin: 15, repsMax: 25, restSeconds: 45 };
  }
  // general
  return category === 'compound'
    ? { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 }
    : { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 };
}

// ── Determine split ────────────────────────────────────────────────────────

function determineSplit(answers: ProgramWizardAnswers): ProgramWizardAnswers['split'] {
  if (answers.split !== 'auto') return answers.split;

  const { daysPerWeek, experience } = answers;
  if (daysPerWeek <= 2) return 'full-body';
  if (daysPerWeek === 3) return experience === 'beginner' ? 'full-body' : 'push-pull-legs';
  if (daysPerWeek === 4) return 'upper-lower';
  if (daysPerWeek >= 5) return experience === 'beginner' ? 'upper-lower' : 'push-pull-legs';
  return 'full-body';
}

// ── Split definitions ──────────────────────────────────────────────────────

interface SplitDay {
  name: string;
  muscles: string[];
}

function getSplitDays(split: ProgramWizardAnswers['split'], daysPerWeek: number): SplitDay[] {
  switch (split) {
    case 'full-body':
      return Array.from({ length: daysPerWeek }, (_, i) => ({
        name: `Full Body ${String.fromCharCode(65 + i)}`,
        muscles: ['Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes', 'Core'],
      }));

    case 'upper-lower': {
      const days: SplitDay[] = [];
      for (let i = 0; i < daysPerWeek; i++) {
        if (i % 2 === 0) {
          days.push({ name: `Upper ${Math.floor(i / 2) + 1}`, muscles: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'] });
        } else {
          days.push({ name: `Lower ${Math.ceil(i / 2)}`, muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'] });
        }
      }
      return days;
    }

    case 'push-pull-legs': {
      const ppl: SplitDay[] = [
        { name: 'Push', muscles: ['Chest', 'Shoulders', 'Triceps'] },
        { name: 'Pull', muscles: ['Back', 'Biceps', 'Forearms'] },
        { name: 'Legs', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'] },
      ];
      const days: SplitDay[] = [];
      for (let i = 0; i < daysPerWeek; i++) {
        const base = ppl[i % 3];
        const label = daysPerWeek > 3 ? `${base.name} ${Math.floor(i / 3) + 1}` : base.name;
        days.push({ name: label, muscles: base.muscles });
      }
      return days;
    }

    case 'bro-split': {
      const broOrder: SplitDay[] = [
        { name: 'Chest Day', muscles: ['Chest'] },
        { name: 'Back Day', muscles: ['Back'] },
        { name: 'Shoulder Day', muscles: ['Shoulders'] },
        { name: 'Leg Day', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
        { name: 'Arms Day', muscles: ['Biceps', 'Triceps'] },
        { name: 'Core & Conditioning', muscles: ['Core', 'Full Body'] },
      ];
      return broOrder.slice(0, daysPerWeek);
    }

    default:
      return [{ name: 'Workout', muscles: ['Chest', 'Back', 'Shoulders', 'Quads'] }];
  }
}

// ── Exercise count per session ─────────────────────────────────────────────

function getExerciseCount(
  sessionLength: ProgramWizardAnswers['sessionLength'],
  split: ProgramWizardAnswers['split']
): number {
  const base: Record<string, number> = { short: 4, medium: 6, long: 8 };
  const count = base[sessionLength] || 6;
  // Full-body needs fewer exercises per muscle (only 1-2 each)
  if (split === 'full-body') return Math.min(count, 7);
  return count;
}

// ── Fetch exercise pool (API or fallback) ──────────────────────────────────

async function getExercisePool(): Promise<Exercise[]> {
  if (!isExerciseDbConfigured()) {
    console.log('[ProgramGenerator] Using fallback exercises (API not configured)');
    return FALLBACK_EXERCISE_DB;
  }

  try {
    // Fetch all exercises from API (cached for 55 min)
    const apiExercises = await fetchAllExercises();

    // If API returns decent results, use them. Otherwise fallback.
    if (apiExercises.length >= 20) {
      console.log(`[ProgramGenerator] Using ${apiExercises.length} exercises from API`);
      // Merge: API exercises + fallback to ensure good coverage of common exercises
      const apiIds = new Set(apiExercises.map(e => e.id));
      const extraFallback = FALLBACK_EXERCISE_DB.filter(e => !apiIds.has(e.id));
      return [...apiExercises, ...extraFallback];
    }

    console.warn(`[ProgramGenerator] API returned only ${apiExercises.length} exercises, using fallback`);
    return FALLBACK_EXERCISE_DB;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[ProgramGenerator] ExerciseDB API failed, using fallback exercises:', errorMsg);
    return FALLBACK_EXERCISE_DB;
  }
}

// ── Main generation function ───────────────────────────────────────────────

export async function generateProgram(answers: ProgramWizardAnswers): Promise<GeneratedProgram> {
  console.log('[ProgramGenerator] Starting program generation...', answers);
  
  const split = determineSplit(answers);
  const splitDays = getSplitDays(split, answers.daysPerWeek);
  const exerciseCount = getExerciseCount(answers.sessionLength, split);

  // Fetch exercise pool from API (or fallback)
  const fullPool = await getExercisePool();
  console.log(`[ProgramGenerator] Loaded ${fullPool.length} total exercises`);

  // Build available exercise pool
  let pool = filterByEquipment(fullPool, answers.equipment);
  console.log(`[ProgramGenerator] After equipment filter: ${pool.length} exercises`);
  
  pool = filterByDifficulty(pool, answers.experience);
  console.log(`[ProgramGenerator] After difficulty filter: ${pool.length} exercises`);

  if (pool.length === 0) {
    throw new Error('No exercises available for the selected equipment and experience level. Try selecting more equipment options.');
  }

  const splitLabels: Record<string, string> = {
    'full-body': 'Full Body',
    'upper-lower': 'Upper/Lower',
    'push-pull-legs': 'Push Pull Legs',
    'bro-split': 'Bro Split',
  };

  const goalLabels: Record<string, string> = {
    strength: 'Strength',
    hypertrophy: 'Hypertrophy',
    endurance: 'Endurance',
    general: 'General Fitness',
  };

  const programName = `${goalLabels[answers.goal]} ${splitLabels[split]}`;
  const description = `${answers.daysPerWeek} days/week · ${goalLabels[answers.goal]} focus · ${answers.sessionLength} sessions`;

  const days: GeneratedDay[] = splitDays.map((splitDay) => {
    // Determine how many compounds vs isolation
    const compoundCount = split === 'full-body'
      ? Math.min(splitDay.muscles.length, exerciseCount)
      : Math.ceil(exerciseCount * 0.5);
    const isoCount = exerciseCount - compoundCount;

    // Priority muscles: include focus muscles if they overlap with this day
    const priorityMuscles = splitDay.muscles.filter(
      (m) => answers.focusMuscles.includes(m)
    );
    const otherMuscles = splitDay.muscles.filter(
      (m) => !answers.focusMuscles.includes(m)
    );

    // Pick compounds first (they hit multiple muscles)
    const compoundPool = pool.filter((e) => e.category === 'compound');
    let compounds: Exercise[] = [];

    if (priorityMuscles.length > 0) {
      const priorityCompounds = pickBest(compoundPool, priorityMuscles, Math.ceil(compoundCount * 0.6), true);
      const remaining = compoundPool.filter((e) => !priorityCompounds.find((p) => p.id === e.id));
      const otherCompounds = pickBest(remaining, otherMuscles.length > 0 ? otherMuscles : splitDay.muscles, compoundCount - priorityCompounds.length, true);
      compounds = [...priorityCompounds, ...otherCompounds];
    } else {
      compounds = pickBest(compoundPool, splitDay.muscles, compoundCount, true);
    }

    // Pick isolation exercises for remaining slots
    const isoPool = pool.filter(
      (e) => e.category === 'isolation' && !compounds.find((c) => c.id === e.id)
    );
    let isolations: Exercise[] = [];

    if (priorityMuscles.length > 0) {
      const priorityIso = pickBest(isoPool, priorityMuscles, Math.ceil(isoCount * 0.7), false);
      const remainingIso = isoPool.filter((e) => !priorityIso.find((p) => p.id === e.id));
      const otherIso = pickBest(remainingIso, otherMuscles.length > 0 ? otherMuscles : splitDay.muscles, isoCount - priorityIso.length, false);
      isolations = [...priorityIso, ...otherIso];
    } else {
      isolations = pickBest(isoPool, splitDay.muscles, isoCount, false);
    }

    const allExercises = [...compounds, ...isolations].slice(0, exerciseCount);

    // Apply set/rep/rest schemes
    const exercises: GeneratedExercise[] = allExercises.map((exercise) => ({
      exercise,
      ...getScheme(answers.goal, exercise.category),
    }));

    // Add warmup exercises (3-4 warmup movements)
    const warmupPool = pool.filter((e) => e.category === 'warmup');
    const warmupExercises: GeneratedExercise[] = warmupPool
      .slice(0, 3)
      .map((exercise) => ({
        exercise,
        sets: 1,
        repsMin: 1,
        repsMax: 1,
        restSeconds: 0,
      }));

    // Add cooldown stretches (4-6 stretches targeting worked muscles)
    const stretchPool = pool.filter((e) => e.category === 'stretch');
    const relevantStretches = stretchPool.filter((stretch) =>
      stretch.muscleGroup.some((muscle) => splitDay.muscles.includes(muscle))
    );
    const cooldownExercises: GeneratedExercise[] = (relevantStretches.length > 0 ? relevantStretches : stretchPool)
      .slice(0, 5)
      .map((exercise) => ({
        exercise,
        sets: 1,
        repsMin: 1,
        repsMax: 1,
        restSeconds: 0,
      }));

    return {
      name: splitDay.name,
      exercises: [...warmupExercises, ...exercises, ...cooldownExercises],
    };
  });

  console.log(`[ProgramGenerator] Program generated successfully: ${programName} with ${days.length} days`);
  return { name: programName, description, days };
}

/**
 * Suggest a split based on days per week and experience.
 */
export function suggestSplit(daysPerWeek: number, experience: string): ProgramWizardAnswers['split'] {
  if (daysPerWeek <= 2) return 'full-body';
  if (daysPerWeek === 3) return experience === 'beginner' ? 'full-body' : 'push-pull-legs';
  if (daysPerWeek === 4) return 'upper-lower';
  if (daysPerWeek >= 5) return 'push-pull-legs';
  return 'full-body';
}
