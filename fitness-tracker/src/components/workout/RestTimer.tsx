import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '../shared/Button';

interface RestTimerProps {
  defaultSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export function RestTimer({ defaultSeconds, onComplete, autoStart = false }: RestTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isActive, setIsActive] = useState(autoStart);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setIsActive(false);
          onCompleteRef.current?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const toggle = () => setIsActive(!isActive);
  const reset = useCallback(() => {
    setSeconds(defaultSeconds);
    setIsActive(false);
  }, [defaultSeconds]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const percentage = (seconds / defaultSeconds) * 100;

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-800/50 rounded-lg">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20" cy="20" r="16"
            stroke="currentColor"
            className="text-gray-700"
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx="20" cy="20" r="16"
            stroke="currentColor"
            className={seconds <= 10 ? 'text-red-500' : 'text-green-500'}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 16}
            strokeDashoffset={2 * Math.PI * 16 * (1 - percentage / 100)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
      </div>
      <span className="text-lg font-mono font-bold text-gray-200 min-w-[52px]">
        {formatTime(seconds)}
      </span>
      <div className="flex gap-1.5">
        <Button onClick={toggle} variant="ghost" size="sm">
          {isActive ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        <Button onClick={reset} variant="ghost" size="sm">
          <RotateCcw size={16} />
        </Button>
      </div>
    </div>
  );
}
