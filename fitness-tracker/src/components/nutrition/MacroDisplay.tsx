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

function MacroRing({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            className="text-gray-800"
            strokeWidth="5"
            fill="none"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={color}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-200">{Math.round(current)}g</span>
        </div>
      </div>
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-[10px] text-gray-600">{target}g goal</span>
    </div>
  );
}

export function MacroDisplay({ current, target }: MacroDisplayProps) {
  const caloriePercent = target.calories > 0 ? Math.min((current.calories / target.calories) * 100, 100) : 0;
  const remaining = target.calories - current.calories;

  return (
    <Card>
      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-white">
          {Math.round(current.calories)}
        </div>
        <div className="text-sm text-gray-400">
          of {target.calories} kcal
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              remaining < 0 ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${caloriePercent}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {remaining > 0 ? `${Math.round(remaining)} kcal remaining` : `${Math.round(Math.abs(remaining))} kcal over`}
        </div>
      </div>

      <div className="flex justify-around pt-3 border-t border-gray-800">
        <MacroRing
          label="Protein"
          current={current.protein}
          target={target.protein}
          color="#3b82f6"
        />
        <MacroRing
          label="Carbs"
          current={current.carbs}
          target={target.carbs}
          color="#22c55e"
        />
        <MacroRing
          label="Fats"
          current={current.fats}
          target={target.fats}
          color="#eab308"
        />
      </div>
    </Card>
  );
}
