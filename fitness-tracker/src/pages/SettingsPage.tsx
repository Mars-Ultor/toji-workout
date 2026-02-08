import { useState, useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { useAuthStore } from '../store/authStore';
import { logOut, updateUserProfile } from '../services/auth.service';
import { seedPublicFoods } from '../services/food.service';
import { useToastStore } from '../store/toastStore';
import { Moon, Sun, Bell, Scale, Palette, LogOut, Trash2, Database } from 'lucide-react';
import { deleteUser } from 'firebase/auth';

function getInitialSettings(profile: ReturnType<typeof useAuthStore.getState>['profile']) {
  if (profile?.preferences) {
    return {
      darkMode: profile.preferences.theme === 'dark',
      units: (profile.preferences.weightUnit === 'lbs' ? 'imperial' : 'metric') as 'metric' | 'imperial',
      notifications: profile.preferences.notifications ?? true,
      showMacros: profile.preferences.macroDisplay !== 'percentages',
      compactView: false,
    };
  }
  return {
    darkMode: true,
    units: 'metric' as 'metric' | 'imperial',
    notifications: true,
    showMacros: true,
    compactView: false,
  };
}

export default function SettingsPage() {
  const { user, profile, setProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [settings, setSettings] = useState(() => getInitialSettings(profile));

  const persistSettings = useCallback(
    async (newSettings: typeof settings) => {
      if (!user) return;
      try {
        const prefs = {
          theme: newSettings.darkMode ? ('dark' as const) : ('light' as const),
          weightUnit: newSettings.units === 'imperial' ? ('lbs' as const) : ('kg' as const),
          macroDisplay: newSettings.showMacros ? ('grams' as const) : ('percentages' as const),
          notifications: newSettings.notifications,
        };
        await updateUserProfile(user.uid, { preferences: prefs });
        if (profile) {
          setProfile({ ...profile, preferences: prefs });
        }
      } catch {
        addToast({ type: 'error', message: 'Failed to save settings' });
      }
    },
    [user, profile, setProfile, addToast]
  );

  const handleToggle = (key: keyof typeof settings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    persistSettings(updated);
  };

  const handleUnitsChange = (units: 'metric' | 'imperial') => {
    const updated = { ...settings, units };
    setSettings(updated);
    persistSettings(updated);
  };

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (
      !window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    )
      return;
    try {
      await deleteUser(user);
      addToast({ type: 'success', message: 'Account deleted' });
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to delete account. You may need to re-authenticate first.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Header title="Settings" subtitle="Customize your experience" />

      {/* Appearance */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Appearance
        </h3>
        <div className="space-y-3">
          <SettingRow
            icon={settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            label="Dark Mode"
            description="Use dark theme across the app"
          >
            <Toggle
              checked={settings.darkMode}
              onChange={() => handleToggle('darkMode')}
            />
          </SettingRow>
          <SettingRow
            icon={<Scale className="w-4 h-4" />}
            label="Compact View"
            description="Show more content with less spacing"
          >
            <Toggle
              checked={settings.compactView}
              onChange={() => handleToggle('compactView')}
            />
          </SettingRow>
        </div>
      </Card>

      {/* Units */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Units & Measurements
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleUnitsChange('metric')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              settings.units === 'metric'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Metric (kg, cm)
          </button>
          <button
            onClick={() => handleUnitsChange('imperial')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              settings.units === 'imperial'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Imperial (lbs, in)
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h3>
        <SettingRow
          icon={<Bell className="w-4 h-4" />}
          label="Push Notifications"
          description="Receive workout and meal reminders"
        >
          <Toggle
            checked={settings.notifications}
            onChange={() => handleToggle('notifications')}
          />
        </SettingRow>
      </Card>

      {/* Display */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Display Options</h3>
        <SettingRow
          icon={<Scale className="w-4 h-4" />}
          label="Show Macro Breakdown"
          description="Display macros on dashboard and nutrition pages"
        >
          <Toggle
            checked={settings.showMacros}
            onChange={() => handleToggle('showMacros')}
          />
        </SettingRow>
      </Card>

      {/* Data Management */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Management
        </h3>
        <SettingRow
          icon={<Database className="w-4 h-4" />}
          label="Seed Food Database"
          description="Populate the public food database with 30 common foods"
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              try {
                await seedPublicFoods();
                addToast({ type: 'success', message: 'Food database seeded with 30 foods' });
              } catch {
                addToast({ type: 'error', message: 'Failed to seed food database' });
              }
            }}
          >
            Seed
          </Button>
        </SettingRow>
      </Card>

      {/* Account Actions */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
        <p className="text-sm text-gray-400 mb-4">
          Signed in as {user?.email}
        </p>
        <div className="space-y-3">
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
          <Button
            variant="danger"
            className="w-full justify-start"
            onClick={handleDeleteAccount}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  description,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <span className="text-gray-400">{icon}</span>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-red-500' : 'bg-gray-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
