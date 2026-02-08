import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { useAuthStore } from './store/authStore';
import { getUserProfile, updateUserProfile } from './services/auth.service';
import { getNutritionTargets } from './services/nutrition.service';
import { subscribeToWorkoutHistory } from './services/workout.service';
import { useNutritionStore } from './store/nutritionStore';
import { useWorkoutStore } from './store/workoutStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navigation } from './components/layout/Navigation';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { ToastContainer } from './components/shared/ToastContainer';

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NutritionPage = lazy(() => import('./pages/NutritionPage'));
const WorkoutPage = lazy(() => import('./pages/WorkoutPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-black">
      <Navigation />
      <main className="flex-1 pb-20 md:pb-0 md:ml-64">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
      <MobileTabBar />
    </div>
  );
}

function AuthListener() {
  const { setUser, setProfile, setLoading } = useAuthStore();
  const { setTargets } = useNutritionStore();
  const { setWorkoutHistory } = useWorkoutStore();

  useEffect(() => {
    let workoutUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          let profile = await getUserProfile(user.uid);
          
          // Create default profile if it doesn't exist
          if (!profile) {
            profile = {
              uid: user.uid,
              email: user.email || '',
              name: user.displayName || user.email?.split('@')[0] || 'User',
              displayName: user.displayName || 'User',
              heightUnit: 'cm',
              activityLevel: 'moderate',
              goal: 'maintain',
              preferences: {
                theme: 'dark',
                weightUnit: 'kg',
                macroDisplay: 'grams',
                notifications: true,
              },
            };
            await updateUserProfile(user.uid, profile);
          }
          
          setProfile(profile);

          // Load nutrition targets (non-blocking)
          try {
            const targets = await getNutritionTargets(user.uid);
            setTargets(targets);
          } catch (error) {
            console.error('Failed to load nutrition targets:', error);
            setTargets(null);
          }

          // Subscribe to workout history (non-blocking)
          try {
            workoutUnsub = subscribeToWorkoutHistory(user.uid, 20, (workouts) => {
              setWorkoutHistory(workouts);
            });
          } catch (error) {
            console.error('Failed to load workout history:', error);
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
        setTargets(null);
        setWorkoutHistory([]);
        if (workoutUnsub) {
          workoutUnsub();
          workoutUnsub = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (workoutUnsub) workoutUnsub();
    };
  }, [setUser, setProfile, setLoading, setTargets, setWorkoutHistory]);

  return null;
}

function AppRoutes() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-black">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" replace /> : <Signup />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nutrition"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NutritionPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workout"
          element={
            <ProtectedRoute>
              <AppLayout>
                <WorkoutPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AnalyticsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthListener />
      <AppRoutes />
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
