import { updateProgramsWithNewFeatures } from '../services/programUpdate.service';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

/**
 * Hook to migrate existing programs to include new features
 */
export function useProgramMigration() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const migratePrograms = async () => {
    if (!user) {
      addToast({ type: 'error', message: 'Please sign in to migrate programs' });
      return false;
    }

    try {
      await updateProgramsWithNewFeatures(user.uid);
      addToast({ 
        type: 'success', 
        message: 'Programs updated with timer support and auto-progression!' 
      });
      return true;
    } catch (error) {
      console.error('Failed to migrate programs:', error);
      addToast({ 
        type: 'error', 
        message: 'Failed to update programs. Please try again.' 
      });
      return false;
    }
  };

  return { migratePrograms };
}
