# Toji Workout - Complete Fitness Tracker

A comprehensive fitness tracking web application built with React, TypeScript, and Firebase. Track nutrition, build custom recipes, log workouts, generate adaptive training programs, and analyze your progress — all in one place.

**Live Demo**: [https://toji-workout-app.web.app](https://toji-workout-app.web.app)

## 🎯 Features

### 📊 Nutrition Tracking
- **Food Database**: Search 300,000+ foods via USDA FoodData Central API
- **Barcode Scanner**: Scan product barcodes with Open Food Facts integration
- **Custom Foods**: Create and save custom food entries
- **Macro Tracking**: Track calories, protein, carbs, and fats
- **Daily Goals**: Automatic macro targets based on activity level and goals (cut/maintain/bulk)
- **Meal Planning**: Organize foods by meal type (breakfast, lunch, dinner, snacks)

### 🍳 Recipe Builder
- **Custom Recipes**: Build recipes with multiple ingredients
- **Nutrition Calculator**: Automatic macro calculation per serving
- **Recipe Database**: Save and reuse your favorite recipes
- **Servings Control**: Adjust servings dynamically
- **Quick Add**: Add recipes to meals in one click

### 💪 Workout Tracking
- **Exercise Library**: 11,000+ exercises from ExerciseDB API with images
- **Workout Logger**: Track sets, reps, weight, RIR, and RPE
- **Exercise History**: View previous performance and progressive overload
- **Adaptive Programs**: Auto-adjusting workout programs based on performance
- **Deload Detection**: Smart recommendations when fatigue accumulates
- **Rest Timer**: Built-in timer between sets
- **Notes**: Add form cues and notes to exercises

### 🏋️ Program Wizard
- **8-Step Smart Builder**: MacroFactor-style questionnaire
- **Auto-Generation**: Creates programs based on:
  - Goal (strength/hypertrophy/endurance/general)
  - Experience level (beginner/intermediate/advanced)
  - Days per week (1-7)
  - Session length (short/medium/long)
  - Equipment available (18 types)
  - Training split (full-body/upper-lower/push-pull-legs/bro-split/auto)
- **11,000+ Exercises**: ExerciseDB RapidAPI integration
- **Warmup & Cooldown**: Auto-includes warmup and stretching sections
- **Visual Sections**: Color-coded warmup (orange), main workout (red), cooldown (blue)
- **Program Editor**: Customize generated programs
- **Multiple Programs**: Save and switch between different training programs

### 📈 Analytics & Progress
- **Body Metrics**: Track weight, body fat %, and measurements (chest, waist, hips, arms, thighs, calves)
- **Progress Charts**: Visualize weight trends and workout volume over time
- **Workout History**: Complete log of all training sessions
- **Macro Trends**: Track nutrition adherence
- **Performance Tracking**: Monitor strength progression per exercise

### ⚙️ Additional Features
- **Dark Theme**: Eye-friendly dark mode UI
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Offline Support**: LocalStorage fallback when offline
- **Firebase Auth**: Secure email/password authentication
- **Real-time Sync**: Data syncs across devices via Firestore
- **Settings**: Customize units (kg/lbs, cm/inches), macro display, notifications

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **APIs**:
  - USDA FoodData Central (nutrition data)
  - Open Food Facts (barcode scanning)
  - ExerciseDB RapidAPI (11,000+ exercises)
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: Zustand

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project with Auth, Firestore, and Hosting enabled

### 1. Clone the repository
```bash
git clone https://github.com/Mars-Ultor/toji-workout.git
cd toji-workout/fitness-tracker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in `fitness-tracker/` directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# USDA FoodData Central API (free: https://fdc.nal.usda.gov/api-key-signup.html)
VITE_USDA_API_KEY=your_usda_api_key

# RapidAPI - ExerciseDB (https://rapidapi.com/ascendapi/api/edb-with-videos-and-images-by-ascendapi)
VITE_RAPIDAPI_KEY=your_rapidapi_key
```

### 4. Firebase Setup

#### Initialize Firebase (if not already done)
```bash
firebase login
firebase use --add  # Select your Firebase project
```

#### Deploy Firestore Rules
```bash
firebase deploy --only firestore
```

#### Enable Authentication
1. Go to Firebase Console → Authentication
2. Enable Email/Password sign-in method

#### Create Firestore Database
1. Go to Firebase Console → Firestore Database
2. Create database in production mode
3. Rules are automatically deployed via `firestore.rules`

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173`

### 6. Build for Production
```bash
npm run build
```

### 7. Deploy to Firebase Hosting
```bash
cd ..  # Go to root directory
firebase deploy --only hosting,firestore
```

## 🔑 API Keys

### USDA FoodData Central (Free)
1. Sign up: https://fdc.nal.usda.gov/api-key-signup.html
2. Add key to `.env` as `VITE_USDA_API_KEY`
3. Falls back to DEMO_KEY (limited to 30 req/hr) if not set

### ExerciseDB RapidAPI (Freemium)
1. Sign up: https://rapidapi.com
2. Subscribe: https://rapidapi.com/ascendapi/api/edb-with-videos-and-images-by-ascendapi
3. Copy API key
4. Add to `.env` as `VITE_RAPIDAPI_KEY`
5. **Free tier**: 100 requests/day (sufficient for typical use)
6. App works with 50 fallback exercises if API unavailable

### Open Food Facts (Free)
- No API key required
- Used for barcode scanning
- Public database

## 📁 Project Structure

```
toji-workout/
├── fitness-tracker/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── nutrition/   # Food tracking, recipes
│   │   │   ├── workout/     # Exercise logger, program builder
│   │   │   ├── analytics/   # Charts and progress
│   │   │   └── shared/      # Reusable UI components
│   │   ├── services/        # API clients and Firebase
│   │   ├── store/           # Zustand state management
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Helper functions
│   ├── firestore.rules      # Firestore security rules
│   ├── storage.rules        # Firebase Storage rules
│   └── .env                 # Environment variables
├── firebase.json            # Firebase configuration
└── README.md
```

## 🔐 Firestore Security

All data is secured with Firestore rules:
- Users can only access their own data
- Authentication required for all operations
- Proper validation on writes

## 🚀 Features Roadmap

- [x] Nutrition tracking with USDA API
- [x] Barcode scanning
- [x] Recipe builder
- [x] Workout logging
- [x] Adaptive workout programs
- [x] Program generation wizard
- [x] ExerciseDB API integration (11,000+ exercises)
- [x] Warmup and cooldown sections
- [x] Exercise history and progression
- [x] Analytics dashboard
- [x] Body metrics tracking
- [ ] Social features (share workouts/programs)
- [ ] Export data (CSV/PDF)
- [ ] Mobile app (React Native)
- [ ] Meal planning calendar
- [ ] Progressive web app (PWA) support
- [ ] Exercise video tutorials

## 🐛 Known Issues

- Large bundle size (648KB) - planned code splitting
- Chrome may show "Unsupported field value: undefined" in console (harmless, auto-filtered)

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Contact

- Repository: https://github.com/Mars-Ultor/toji-workout
- Issues: https://github.com/Mars-Ultor/toji-workout/issues

## 🙏 Acknowledgments

- **USDA FoodData Central** for nutrition data
- **Open Food Facts** for barcode database
- **ExerciseDB** for exercise library
- **Firebase** for backend infrastructure
- **Recharts** for data visualization

---

**Built with ❤️ for fitness enthusiasts**
