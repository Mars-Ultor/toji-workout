import { Check, Minus, Plus, TrendingUp, TrendingDown, Minus as TrendMaintain, AlertTriangle } from 'lucide-react';
import { Button } from '../shared/Button';
import type { WorkoutSet } from '../../types/workout.types';
import type { ProgressionSuggestion, ExerciseHistory } from '../../services/progression.service';

interface SetTrackerProps {
  sets: WorkoutSet[];
  onUpdateSet: (setIndex: number, data: Partial<WorkoutSet>) => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  weightUnit?: 'kg' | 'lbs';
  suggestion?: ProgressionSuggestion | null;
  history?: ExerciseHistory | null;
}

export function SetTracker({
  sets,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  weightUnit = 'kg',
  suggestion,
  history,
}: SetTrackerProps) {
  const lastSession = history?.sessions?.[0];

  return (
    <div className="space-y-2">
      {/* Previous session & suggestion banners */}
      {lastSession && (
        <div className="bg-gray-800/60 rounded-lg px-3 py-2 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-gray-400">
            <span className="text-gray-600 font-medium">Last time:</span>
            {lastSession.sets.map((s, i) => (
              <span key={i} className="text-gray-500">
                {s.weight}{weightUnit}×{s.reps}{i < lastSession.sets.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>
          <div className="text-gray-600">
            Best set: {lastSession.bestSet.weight}{weightUnit} × {lastSession.bestSet.reps} · Volume: {lastSession.totalVolume.toLocaleString()}{weightUnit}
          </div>
        </div>
      )}

      {suggestion && suggestion.previousBest && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
          suggestion.trend === 'up' ? 'bg-green-900/20 text-green-400' :
          suggestion.trend === 'deload' ? 'bg-orange-900/20 text-orange-400' :
          suggestion.trend === 'down' ? 'bg-red-900/20 text-red-400' :
          'bg-blue-900/20 text-blue-400'
        }`}>
          {suggestion.trend === 'up' && <TrendingUp size={14} />}
          {suggestion.trend === 'down' && <TrendingDown size={14} />}
          {suggestion.trend === 'deload' && <AlertTriangle size={14} />}
          {suggestion.trend === 'maintain' && <TrendMaintain size={14} />}
          <span className="flex-1">{suggestion.recommendation}</span>
          {suggestion.weight > 0 && (
            <span className="font-semibold">{suggestion.weight}{weightUnit} × {suggestion.reps}</span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_1fr_60px_40px] gap-2 text-[11px] text-gray-500 font-medium px-1">
        <span>Set</span>
        <span>{weightUnit.toUpperCase()}</span>
        <span>Reps</span>
        <span>RIR</span>
        <span></span>
      </div>

      {/* Sets */}
      {sets.map((set, index) => (
        <div
          key={index}
          className={`grid grid-cols-[40px_1fr_1fr_60px_40px] gap-2 items-center px-1 py-1 rounded-lg ${
            set.completed ? 'bg-green-900/10' : ''
          }`}
        >
          <span className="text-sm font-medium text-gray-400 text-center">{set.setNumber}</span>

          <input
            type="number"
            value={set.weight || ''}
            onChange={(e) => onUpdateSet(index, { weight: Number(e.target.value) })}
            placeholder={suggestion?.weight ? String(suggestion.weight) : '0'}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-center text-gray-200 focus:outline-none focus:ring-1 focus:ring-red-500/50 w-full"
          />

          <input
            type="number"
            value={set.reps || ''}
            onChange={(e) => onUpdateSet(index, { reps: Number(e.target.value) })}
            placeholder={suggestion?.reps ? String(suggestion.reps) : '0'}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-center text-gray-200 focus:outline-none focus:ring-1 focus:ring-red-500/50 w-full"
          />

          <input
            type="number"
            value={set.rir ?? ''}
            onChange={(e) => onUpdateSet(index, { rir: Number(e.target.value) })}
            placeholder="-"
            min="0"
            max="10"
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-center text-gray-200 focus:outline-none focus:ring-1 focus:ring-red-500/50 w-full"
          />

          <button
            onClick={() => onUpdateSet(index, { completed: !set.completed })}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              set.completed
                ? 'bg-green-500 text-white'
                : 'bg-gray-800 text-gray-500 hover:text-white border border-gray-700'
            }`}
            aria-label={set.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            <Check size={14} />
          </button>
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onAddSet} className="text-xs">
          <Plus size={14} /> Add Set
        </Button>
        {sets.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveSet(sets.length - 1)}
            className="text-xs text-gray-500"
          >
            <Minus size={14} /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}
