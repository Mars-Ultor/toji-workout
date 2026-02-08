# VS Code Prompt for Fitness Tracker Application

## Project Setup Instructions

Create a comprehensive fitness tracking web application that combines nutrition tracking and workout logging, similar to MacroFactor's nutrition and workout apps. The application should be built with React, TypeScript, and Firebase.

### Initial Setup

```bash
# Create new Vite project with React and TypeScript
npm create vite@latest fitness-tracker -- --template react-ts
cd fitness-tracker

# Install core dependencies
npm install firebase
npm install react-router-dom
npm install @tanstack/react-query
npm install zustand
npm install date-fns
npm install recharts
npm install lucide-react
npm install clsx tailwind-merge

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node
npx tailwindcss init -p
```

### Firebase Configuration

1. Create a new Firebase project at console.firebase.google.com
2. Enable Authentication (Email/Password and Google)
3. Create Firestore database in production mode
4. Enable Storage
5. Set up Firebase Hosting
6. Copy Firebase config and create `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Project Structure

Create the following folder structure:

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── nutrition/
│   │   ├── FoodLogger.tsx
│   │   ├── FoodSearch.tsx
│   │   ├── MealCard.tsx
│   │   ├── MacroDisplay.tsx
│   │   ├── QuickAddFood.tsx
│   │   └── NutritionDashboard.tsx
│   ├── workout/
│   │   ├── WorkoutLogger.tsx
│   │   ├── ExerciseList.tsx
│   │   ├── SetTracker.tsx
│   │   ├── RestTimer.tsx
│   │   ├── ProgramBuilder.tsx
│   │   └── WorkoutHistory.tsx
│   ├── analytics/
│   │   ├── WeightChart.tsx
│   │   ├── CalorieChart.tsx
│   │   ├── StrengthChart.tsx
│   │   └── ProgressPhotos.tsx
│   ├── shared/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── DatePicker.tsx
│   │   └── LoadingSpinner.tsx
│   └── layout/
│       ├── Navigation.tsx
│       ├── Header.tsx
│       └── MobileTabBar.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── NutritionPage.tsx
│   ├── WorkoutPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── ProfilePage.tsx
│   └── SettingsPage.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useFoodLog.ts
│   ├── useWorkoutLog.ts
│   ├── useBodyMetrics.ts
│   └── useTDEECalculation.ts
├── services/
│   ├── firebase.ts
│   ├── auth.service.ts
│   ├── nutrition.service.ts
│   ├── workout.service.ts
│   └── analytics.service.ts
├── store/
│   ├── authStore.ts
│   ├── nutritionStore.ts
│   └── workoutStore.ts
├── utils/
│   ├── calculations.ts
│   ├── dateHelpers.ts
│   ├── validators.ts
│   └── constants.ts
├── types/
│   ├── nutrition.types.ts
│   ├── workout.types.ts
│   ├── user.types.ts
│   └── index.ts
├── lib/
│   └── cn.ts (className utility)
├── App.tsx
├── main.tsx
└── index.css
```

## Implementation Instructions

### 1. Core Type Definitions

Create comprehensive TypeScript types in `src/types/`:

**nutrition.types.ts:**
```typescript
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
```

**workout.types.ts:**
```typescript
export interface Exercise {
  id: string;
  name: string;
  category: 'compound' | 'isolation' | 'cardio';
  muscleGroup: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string;
  videoUrl?: string;
}

export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number; // Reps in reserve
  rpe?: number; // Rate of perceived exertion
  completed: boolean;
  restSeconds?: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  userId: string;
  date: Date;
  name: string;
  exercises: WorkoutExercise[];
  duration?: number;
  notes?: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  weeks: ProgramWeek[];
}

export interface ProgramWeek {
  weekNumber: number;
  days: ProgramDay[];
}

export interface ProgramDay {
  dayNumber: number;
  name: string;
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  exerciseId: string;
  sets: number;
  reps: string; // e.g., "8-12"
  restSeconds: number;
}
```

**user.types.ts:**
```typescript
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  heightUnit: 'cm' | 'inches';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
  goal: 'cut' | 'maintain' | 'bulk';
  preferences: {
    theme: 'light' | 'dark';
    weightUnit: 'kg' | 'lbs';
    macroDisplay: 'grams' | 'percentages';
    notifications: boolean;
  };
}

export interface BodyMetrics {
  date: string;
  weight: number;
  bodyFat?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    legs?: number;
  };
  photos?: string[];
}
```

### 2. Firebase Configuration

**src/services/firebase.ts:**
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

### 3. Key Algorithms

**src/utils/calculations.ts:**
```typescript
/**
 * Calculate TDEE based on weight trend and calorie intake
 * Uses the energy balance equation
 */
export function calculateTDEE(
  avgCaloriesPerDay: number,
  weightChange: number, // in kg
  days: number
): number {
  // 1 kg of fat ≈ 7700 calories
  const caloriesFromWeightChange = (weightChange * 7700) / days;
  return avgCaloriesPerDay + caloriesFromWeightChange;
}

/**
 * Calculate recommended calorie target based on goal
 */
export function calculateCalorieTarget(
  tdee: number,
  goal: 'cut' | 'maintain' | 'bulk'
): number {
  switch (goal) {
    case 'cut':
      return Math.round(tdee * 0.8); // 20% deficit
    case 'bulk':
      return Math.round(tdee * 1.1); // 10% surplus
    case 'maintain':
    default:
      return Math.round(tdee);
  }
}

/**
 * Calculate recommended macro split
 */
export function calculateMacros(
  calories: number,
  bodyWeight: number, // in kg
  goal: 'cut' | 'maintain' | 'bulk'
): { protein: number; carbs: number; fats: number } {
  // Protein: 2.2g per kg body weight
  const protein = Math.round(bodyWeight * 2.2);
  
  // Fats: 25-30% of calories
  const fatPercentage = goal === 'cut' ? 0.25 : 0.3;
  const fats = Math.round((calories * fatPercentage) / 9);
  
  // Carbs: remaining calories
  const remainingCalories = calories - (protein * 4) - (fats * 9);
  const carbs = Math.round(remainingCalories / 4);
  
  return { protein, carbs, fats };
}

/**
 * Calculate weight trend using exponential smoothing
 */
export function calculateWeightTrend(
  weights: { date: string; weight: number }[],
  smoothingFactor: number = 0.3
): number {
  if (weights.length === 0) return 0;
  
  let trend = weights[0].weight;
  for (let i = 1; i < weights.length; i++) {
    trend = smoothingFactor * weights[i].weight + (1 - smoothingFactor) * trend;
  }
  
  return Number(trend.toFixed(1));
}

/**
 * Progressive overload calculation
 */
export function calculateProgression(
  currentWeight: number,
  targetReps: number,
  actualReps: number,
  rir: number
): { newWeight: number; newReps: number; recommendation: string } {
  // If completed all reps with 2+ RIR, increase weight
  if (actualReps >= targetReps && rir >= 2) {
    return {
      newWeight: currentWeight * 1.025, // 2.5% increase
      newReps: targetReps,
      recommendation: 'Increase weight by 2.5%'
    };
  }
  
  // If barely completed with 0-1 RIR, maintain
  if (actualReps >= targetReps && rir < 2) {
    return {
      newWeight: currentWeight,
      newReps: targetReps,
      recommendation: 'Maintain current weight'
    };
  }
  
  // If failed to complete, reduce weight or reps
  return {
    newWeight: currentWeight * 0.95, // 5% decrease
    newReps: targetReps,
    recommendation: 'Reduce weight by 5% or target fewer reps'
  };
}

/**
 * Calculate training volume (sets × reps × weight)
 */
export function calculateVolume(
  sets: { weight: number; reps: number }[]
): number {
  return sets.reduce((total, set) => total + (set.weight * set.reps), 0);
}
```

### 4. Key React Hooks

**src/hooks/useAuth.ts:**
```typescript
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
```

**src/hooks/useFoodLog.ts:**
```typescript
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { DailyNutrition } from '../types/nutrition.types';

export function useFoodLog(userId: string, date: string) {
  const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, `foodLogs/${userId}/${date}`),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Process snapshot and set daily nutrition
      setLoading(false);
    });

    return unsubscribe;
  }, [userId, date]);

  return { dailyNutrition, loading };
}
```

### 5. Main Components

**src/components/nutrition/MacroDisplay.tsx:**
```typescript
import React from 'react';
import { Card } from '../shared/Card';

interface MacroDisplayProps {
  current: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  target: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export function MacroDisplay({ current, target }: MacroDisplayProps) {
  const getPercentage = (curr: number, targ: number) => 
    Math.min((curr / targ) * 100, 100);

  const MacroBar = ({ 
    label, 
    current, 
    target, 
    color 
  }: { 
    label: string; 
    current: number; 
    target: number; 
    color: string;
  }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-sm text-gray-600">
          {current}g / {target}g
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${getPercentage(current, target)}%` }}
        />
      </div>
    </div>
  );

  return (
    <Card>
      <h3 className="text-xl font-bold mb-4">Today's Nutrition</h3>
      
      <div className="mb-6">
        <div className="text-3xl font-bold">
          {current.calories} / {target.calories}
        </div>
        <div className="text-gray-600">Calories</div>
      </div>

      <MacroBar 
        label="Protein" 
        current={current.protein} 
        target={target.protein}
        color="bg-blue-500"
      />
      <MacroBar 
        label="Carbs" 
        current={current.carbs} 
        target={target.carbs}
        color="bg-green-500"
      />
      <MacroBar 
        label="Fats" 
        current={current.fats} 
        target={target.fats}
        color="bg-yellow-500"
      />
    </Card>
  );
}
```

**src/components/workout/RestTimer.tsx:**
```typescript
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '../shared/Button';

interface RestTimerProps {
  defaultSeconds: number;
  onComplete?: () => void;
}

export function RestTimer({ defaultSeconds, onComplete }: RestTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      onComplete?.();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds, onComplete]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setSeconds(defaultSeconds);
    setIsActive(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
      <div className="text-3xl font-bold font-mono">
        {formatTime(seconds)}
      </div>
      <Button onClick={toggle} variant="primary" size="sm">
        {isActive ? <Pause size={20} /> : <Play size={20} />}
      </Button>
      <Button onClick={reset} variant="secondary" size="sm">
        <RotateCcw size={20} />
      </Button>
    </div>
  );
}
```

### 6. Firestore Services

**src/services/nutrition.service.ts:**
```typescript
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { DailyNutrition, MealEntry, NutritionTargets } from '../types/nutrition.types';

export async function logMeal(
  userId: string, 
  date: string, 
  mealEntry: Omit<MealEntry, 'id'>
) {
  const docRef = await addDoc(
    collection(db, `foodLogs/${userId}/${date}`),
    {
      ...mealEntry,
      timestamp: new Date()
    }
  );
  return docRef.id;
}

export async function getDailyNutrition(
  userId: string, 
  date: string
): Promise<DailyNutrition | null> {
  const q = query(collection(db, `foodLogs/${userId}/${date}`));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;

  const meals = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MealEntry[];

  const totals = meals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.food.macros.calories * meal.servings),
    protein: acc.protein + (meal.food.macros.protein * meal.servings),
    carbs: acc.carbs + (meal.food.macros.carbs * meal.servings),
    fats: acc.fats + (meal.food.macros.fats * meal.servings),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  return { date, meals, totals };
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
```

**src/services/workout.service.ts:**
```typescript
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from './firebase';
import { Workout, Exercise } from '../types/workout.types';

export async function logWorkout(
  userId: string, 
  workout: Omit<Workout, 'id' | 'userId'>
) {
  const docRef = await addDoc(
    collection(db, `workoutLogs/${userId}`),
    {
      ...workout,
      userId,
      date: new Date()
    }
  );
  return docRef.id;
}

export async function getWorkoutHistory(
  userId: string,
  limitCount: number = 10
): Promise<Workout[]> {
  const q = query(
    collection(db, `workoutLogs/${userId}`),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Workout[];
}

export async function getExercises(): Promise<Exercise[]> {
  const snapshot = await getDocs(collection(db, 'exercises'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Exercise[];
}
```

### 7. Deployment Setup

**firebase.json:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

**firestore.rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Food logs
    match /foodLogs/{userId}/{date} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Workout logs
    match /workoutLogs/{userId}/{workoutId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Nutrition targets
    match /nutritionTargets/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Body metrics
    match /bodyMetrics/{userId}/{date} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public exercise database
    match /exercises/{exerciseId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins can write
    }
    
    // Public food database
    match /foods/{foodId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins can write
    }
  }
}
```

## Build and Deploy Commands

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

## Key Features to Implement First (MVP)

1. **Authentication Flow**
   - Login/Signup pages
   - Protected routes
   - User profile creation

2. **Nutrition Tracking**
   - Manual food entry
   - Daily macro tracking
   - Simple calorie counter

3. **Workout Logging**
   - Exercise selection
   - Set/rep tracking
   - Workout history

4. **Dashboard**
   - Today's overview
   - Quick stats
   - Recent activities

5. **Data Visualization**
   - Weight trend chart
   - Calorie intake chart

## Progressive Enhancement

After MVP, add:
- TDEE calculations
- Progressive overload automation
- Barcode scanning
- Advanced analytics
- Meal templates
- Program builder
- Progress photos

## Performance Optimization Tips

1. Use React.lazy for route-based code splitting
2. Implement virtual scrolling for long lists
3. Debounce search inputs
4. Use Firestore query cursors for pagination
5. Cache frequently accessed data
6. Optimize images before upload
7. Use service workers for offline support

## Testing Recommendations

1. Set up Vitest for unit tests
2. Test calculation functions thoroughly
3. Test Firebase security rules locally
4. Use Firebase emulator for development
5. Implement E2E tests for critical paths

## Additional Integrations to Consider

1. USDA FoodData Central API for food database
2. Open Food Facts API for barcode scanning
3. Stripe for premium features (future)
4. SendGrid for email notifications
5. Cloud Functions for scheduled TDEE calculations
