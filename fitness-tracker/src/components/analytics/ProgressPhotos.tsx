import { useState, useEffect, useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { useAuthStore } from '../../store/authStore';
import { uploadProgressPhoto, getProgressPhotos } from '../../services/analytics.service';
import { getToday } from '../../utils/dateHelpers';
import { useToastStore } from '../../store/toastStore';

export function ProgressPhotos() {
  const { user } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToastStore();

  useEffect(() => {
    if (!user) return;
    getProgressPhotos(user.uid).then(setPhotos).catch(() => {});
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const url = await uploadProgressPhoto(user.uid, file, getToday());
      setPhotos((prev) => [...prev, url]);
      addToast({ type: 'success', message: 'Photo uploaded!' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload failed';
      addToast({ type: 'error', message: msg });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300">Progress Photos</h3>
        <Button
          variant="ghost"
          size="sm"
          loading={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={14} /> Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
              <img src={url} alt={`Progress ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-600">
          <Camera className="mx-auto mb-2" size={32} />
          <p className="text-sm">No progress photos yet</p>
          <p className="text-xs text-gray-700 mt-1">Upload photos to track your visual progress</p>
        </div>
      )}
    </Card>
  );
}
