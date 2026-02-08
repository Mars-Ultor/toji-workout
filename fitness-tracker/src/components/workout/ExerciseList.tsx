import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, Wifi, WifiOff } from 'lucide-react';
import { Input } from '../shared/Input';
import { DEFAULT_EXERCISES, MUSCLE_GROUPS } from '../../utils/constants';
import { searchExercises, isExerciseDbConfigured } from '../../services/exercisedb.service';
import type { Exercise } from '../../types/workout.types';

interface ExerciseListProps {
  onSelect: (exercise: Exercise) => void;
}

export function ExerciseList({ onSelect }: ExerciseListProps) {
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiMode, setApiMode] = useState(isExerciseDbConfigured());
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fallback exercises from constants
  const fallbackExercises: Exercise[] = DEFAULT_EXERCISES.map((e, i) => ({
    id: `default-${i}`,
    name: e.name,
    category: e.category,
    muscleGroup: [...e.muscleGroup],
    equipment: [...e.equipment],
    difficulty: e.difficulty,
  }));

  // Load exercises from API on mount and when query changes
  const loadExercises = useCallback(async (searchQuery: string) => {
    if (!apiMode) return;
    setLoading(true);
    setError(null);
    try {
      const results = await searchExercises(searchQuery);
      setExercises(results);
    } catch (err) {
      console.error('ExerciseDB API error:', err);
      setError('API unavailable — showing offline exercises');
      setApiMode(false);
    } finally {
      setLoading(false);
    }
  }, [apiMode]);

  // Initial load
  useEffect(() => {
    if (apiMode) {
      loadExercises('');
    }
  }, [apiMode, loadExercises]);

  // Debounced search
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!apiMode) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadExercises(value), 300);
  };

  // Determine which exercises to show
  const displayExercises = apiMode ? exercises : fallbackExercises;

  const filtered = displayExercises.filter((e) => {
    const matchesQuery = !apiMode
      ? e.name.toLowerCase().includes(query.toLowerCase())
      : true; // API already filtered
    const matchesMuscle = !muscleFilter || e.muscleGroup.includes(muscleFilter);
    return matchesQuery && matchesMuscle;
  });

  return (
    <div className="space-y-3">
      {/* API status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px]">
          {apiMode ? (
            <>
              <Wifi size={12} className="text-green-400" />
              <span className="text-green-400">ExerciseDB API</span>
              <span className="text-gray-600">({displayExercises.length} exercises)</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-gray-500" />
              <span className="text-gray-500">Offline mode</span>
            </>
          )}
        </div>
        {!apiMode && isExerciseDbConfigured() && (
          <button
            onClick={() => setApiMode(true)}
            className="text-[10px] text-red-400 hover:text-red-300"
          >
            Retry API
          </button>
        )}
      </div>

      {error && (
        <div className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1.5 rounded">
          {error}
        </div>
      )}

      <Input
        placeholder="Search exercises..."
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        icon={loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
      />

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setMuscleFilter(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            !muscleFilter ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          All
        </button>
        {MUSCLE_GROUPS.map((group) => (
          <button
            key={group}
            onClick={() => setMuscleFilter(muscleFilter === group ? null : group)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              muscleFilter === group
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {loading && exercises.length === 0 && (
          <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading exercises...</span>
          </div>
        )}

        {filtered.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => onSelect(exercise)}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors group"
          >
            <div className="flex items-center gap-3">
              {/* Exercise image thumbnail */}
              {exercise.imageUrl && (
                <img
                  src={exercise.imageUrl}
                  alt={exercise.name}
                  className="w-10 h-10 rounded object-cover bg-gray-800 flex-shrink-0"
                  loading="lazy"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
                      {exercise.name}
                    </div>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {exercise.muscleGroup.slice(0, 3).map((mg) => (
                        <span key={mg} className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                          {mg}
                        </span>
                      ))}
                      {exercise.equipment.slice(0, 1).map((eq) => (
                        <span key={eq} className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ml-2 ${
                    exercise.difficulty === 'beginner' ? 'bg-green-900/30 text-green-400' :
                    exercise.difficulty === 'intermediate' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {exercise.difficulty}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}

        {!loading && filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No exercises found</p>
        )}
      </div>
    </div>
  );
}
