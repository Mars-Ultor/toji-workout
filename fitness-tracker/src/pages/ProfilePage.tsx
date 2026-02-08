import { useState, useRef, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/shared/Card';
import { Input } from '../components/shared/Input';
import { Button } from '../components/shared/Button';
import { useAuthStore } from '../store/authStore';
import { updateUserProfile } from '../services/auth.service';
import { useToastStore } from '../store/toastStore';
import { uploadProgressPhoto } from '../services/analytics.service';
import { ACTIVITY_LEVELS, GOALS } from '../utils/constants';
import { User, Camera } from 'lucide-react';
import type { UserProfile } from '../types';

export default function ProfilePage() {
  const { user, profile, setProfile } = useAuthStore();
  const { addToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    age: profile?.age?.toString() || '',
    height: profile?.height?.toString() || '',
    weight: profile?.weight?.toString() || '',
    activityLevel: profile?.activityLevel || 'moderate',
    goal: profile?.goal || 'maintain',
    gender: profile?.gender || 'male',
  });

  // Sync formData when profile loads or changes
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        age: profile.age?.toString() || '',
        height: profile.height?.toString() || '',
        weight: profile.weight?.toString() || '',
        activityLevel: profile.activityLevel || 'moderate',
        goal: profile.goal || 'maintain',
        gender: profile.gender || 'male',
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    try {
      const updatedProfile: Partial<UserProfile> = {
        displayName: formData.displayName,
        age: parseInt(formData.age) || undefined,
        height: parseFloat(formData.height) || undefined,
        weight: parseFloat(formData.weight) || undefined,
        activityLevel: formData.activityLevel as UserProfile['activityLevel'],
        goal: formData.goal as UserProfile['goal'],
        gender: formData.gender as UserProfile['gender'],
      };
      
      await updateUserProfile(user.uid, updatedProfile);
      setProfile({ ...profile, ...updatedProfile });
      setIsEditing(false);
      addToast({ type: 'success', message: 'Profile updated' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      addToast({ type: 'error', message: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const url = await uploadProgressPhoto(user.uid, file, 'avatar');
      await updateUserProfile(user.uid, { photoURL: url });
      if (profile) setProfile({ ...profile, photoURL: url });
      addToast({ type: 'success', message: 'Photo updated' });
    } catch {
      addToast({ type: 'error', message: 'Failed to upload photo' });
    }
  };

  return (
    <div className="space-y-6">
      <Header title="Profile" subtitle="Manage your personal information" />

      {/* Avatar Section */}
      <Card className="flex flex-col items-center py-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-red-500 rounded-full p-1.5 text-white hover:bg-red-600 transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">
          {profile?.displayName || 'User'}
        </h2>
        <p className="text-gray-400 text-sm">{user?.email}</p>
      </Card>

      {/* Personal Info */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Personal Information</h3>
          {!isEditing ? (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} loading={saving}>
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Input
            label="Display Name"
            value={formData.displayName}
            onChange={(e) => handleChange('displayName', e.target.value)}
            disabled={!isEditing}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Age"
              type="number"
              value={formData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              disabled={!isEditing}
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                disabled={!isEditing}
                className="input-field w-full"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Height (cm)"
              type="number"
              value={formData.height}
              onChange={(e) => handleChange('height', e.target.value)}
              disabled={!isEditing}
            />
            <Input
              label="Weight (kg)"
              type="number"
              value={formData.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Activity Level
            </label>
            <select
              value={formData.activityLevel}
              onChange={(e) => handleChange('activityLevel', e.target.value)}
              disabled={!isEditing}
              className="input-field w-full"
            >
              {ACTIVITY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Goal
            </label>
            <select
              value={formData.goal}
              onChange={(e) => handleChange('goal', e.target.value)}
              disabled={!isEditing}
              className="input-field w-full"
            >
              {GOALS.map((goal) => (
                <option key={goal.value} value={goal.value}>
                  {goal.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}
