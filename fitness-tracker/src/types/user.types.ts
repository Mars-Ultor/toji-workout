export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  displayName?: string;
  photoURL?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
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
