import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, Loader2, ScanBarcode } from 'lucide-react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Card } from '../shared/Card';
import { lookupBarcode } from '../../services/openfoodfacts.service';
import type { Food } from '../../types/nutrition.types';

interface BarcodeScannerProps {
  onResult: (food: Food) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [manualBarcode, setManualBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError('Could not access camera. Please enter the barcode manually.');
      setMode('manual');
    }
  }, []);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  const handleBarcodeLookup = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const food = await lookupBarcode(barcode.trim());
      if (food) {
        stopCamera();
        onResult(food);
      } else {
        setError(`No product found for barcode: ${barcode}`);
      }
    } catch {
      setError('Failed to look up barcode. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [stopCamera, onResult]);

  const captureAndDecode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Use BarcodeDetector API if available (Chrome, Edge, Android)
    if ('BarcodeDetector' in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
        });
        const barcodes = await detector.detect(canvas);
        if (barcodes.length > 0) {
          await handleBarcodeLookup(barcodes[0].rawValue);
          return;
        }
      } catch {
        // BarcodeDetector failed, fall through
      }
    }

    setError('No barcode detected. Try adjusting the camera angle or enter manually.');
  }, [handleBarcodeLookup]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ScanBarcode className="w-5 h-5" />
          Barcode Scanner
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('camera')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'camera'
              ? 'bg-red-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Camera size={16} className="inline mr-1.5" />
          Camera
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-red-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Enter Manually
        </button>
      </div>

      {mode === 'camera' && (
        <div className="space-y-3">
          {cameraError ? (
            <Card className="text-center py-6">
              <p className="text-sm text-red-400">{cameraError}</p>
            </Card>
          ) : (
            <>
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {/* Scan guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-16 border-2 border-red-500/60 rounded-lg" />
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <Button
                onClick={captureAndDecode}
                className="w-full"
                loading={loading}
              >
                <Camera size={16} />
                Capture & Scan
              </Button>
            </>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-3">
          <Input
            label="Barcode Number"
            placeholder="e.g., 0071720001837"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            type="text"
            inputMode="numeric"
          />
          <Button
            onClick={() => handleBarcodeLookup(manualBarcode)}
            className="w-full"
            loading={loading}
            disabled={!manualBarcode.trim()}
          >
            <ScanBarcode size={16} />
            Look Up Product
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Looking up product...
        </div>
      )}
    </div>
  );
}
