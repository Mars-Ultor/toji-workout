import { useState, useMemo } from 'react';
import { Plus, Timer, ChevronDown, ChevronUp, ArrowUp, ArrowDown, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { Card } from '../shared/Card';
import { ExerciseList } from './ExerciseList';
import { SetTracker } from './SetTracker';
import { RestTimer } from './RestTimer';
import { useWorkoutStore } from '../../store/workoutStore';
import { useAuthStore } from '../../store/authStore';
import { logWorkout } from '../../services/workout.service';
import { useToastStore } from '../../store/toastStore';
import { useExerciseHistory, useDeloadCheck } from '../../hooks/useExerciseHistory';
import { generateProgramUpdates } from '../../services/progression.service';
import type { Exercise } from '../../types/workout.types';

export function WorkoutLogger() {
  const { user, profile } = useAuthStore();
  const {
    activeWorkout,
    startWorkout,
    endWorkout,
    addExercise,
    removeExercise,
    updateSet,
    addSet,
    removeSet,
    moveExercise,
    updateExerciseNotes,
  } = useWorkoutStore();

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [postWorkoutSummary, setPostWorkoutSummary] = useState<Map<string, { recommendation: string }> | null>(null);
  const { addToast } = useToastStore();

  // Gather exercise IDs from active workout for history lookup
  const exerciseIds = useMemo(
    () => activeWorkout?.exercises.map((ex) => ex.exerciseId || ex.exercise?.id).filter(Boolean) as string[] || [],
    [activeWorkout?.exercises]
  );

  // Load exercise history & progression suggestions
  const { getHistory, getSuggestionFor, loaded: historyLoaded } = useExerciseHistory(exerciseIds);

  // Check if deload is needed
  const { deload } = useDeloadCheck();

  const handleStart = () => {
    startWorkout(`Workout ${new Date().toLocaleDateString()}`);
  };

  const handleAddExercise = (exercise: Exercise) => {
    addExercise(exercise);
    setShowExerciseModal(false);
    setExpandedExercise((activeWorkout?.exercises.length ?? 0));
  };

  const handleFinish = async () => {
    if (!user || !activeWorkout) return;
    const incompleteSets = activeWorkout.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => !s.completed).length,
      0
    );
    if (incompleteSets > 0) {
      if (!window.confirm(`You have ${incompleteSets} incomplete set(s). Finish anyway?`)) {
        return;
      }
    }
    setSaving(true);
    try {
      const duration = activeWorkout.startTime
        ? Math.round((Date.now() - activeWorkout.startTime.getTime()) / 1000)
        : 0;

      await logWorkout(user.uid, {
        name: activeWorkout.name,
        exercises: activeWorkout.exercises,
        date: new Date().toISOString(),
        duration,
      });

      // Generate post-workout progression summary
      const completedExercises = activeWorkout.exercises.map((ex) => ({
        exerciseId: ex.exerciseId || ex.exercise?.id,
        sets: ex.sets,
      }));
      const programTargets = activeWorkout.exercises.map((ex) => ({
        exerciseId: ex.exerciseId || ex.exercise?.id,
        sets: ex.sets.length,
        repsMin: 8,
        repsMax: 12,
      }));
      const updates = generateProgramUpdates(completedExercises, programTargets);
      if (updates.size > 0) {
        setPostWorkoutSummary(updates);
      }

      endWorkout();
      addToast({ type: 'success', message: 'Workout saved!' });
    } catch {
      addToast({ type: 'error', message: 'Failed to save workout' });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Discard this workout?')) {
      endWorkout();
    }
  };

  if (!activeWorkout) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        {/* Post-workout progression summary */}
        {postWorkoutSummary && postWorkoutSummary.size > 0 && (
          <Card className="w-full max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-green-400" />
              <h3 className="text-sm font-semibold text-gray-200">Workout Summary</h3>
            </div>
            <div className="space-y-2">
              {Array.from(postWorkoutSummary.entries()).map(([exId, update]) => (
                <div key={exId} className="text-xs text-gray-400 bg-gray-800/50 rounded-lg px-3 py-2">
                  <span className="text-gray-300 font-medium">{exId}:</span>{' '}
                  {update.recommendation}
                </div>
              ))}
            </div>
            <button
              onClick={() => setPostWorkoutSummary(null)}
              className="text-xs text-gray-600 hover:text-gray-400 mt-3"
            >
              Dismiss
            </button>
          </Card>
        )}

        {/* Deload warning */}
        {deload?.needed && (
          <Card className="w-full max-w-md ring-1 ring-orange-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-orange-300">Deload Recommended</h3>
                <p className="text-xs text-gray-400 mt-1">{deload.reason}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Suggestion: use {Math.round(deload.suggestedWeightMultiplier * 100)}% of your normal weight
                  and {Math.round(deload.suggestedVolumeMultiplier * 100)}% of normal volume this week.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="text-6xl">🏋️</div>
        <h2 className="text-xl font-bold text-gray-200">Ready to train?</h2>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Start a new workout to track your exercises, sets, and reps.
        </p>
        <Button onClick={handleStart} size="lg">
          <Plus size={20} /> Start Workout
        </Button>
      </div>
    );
  }

  const totalSets = activeWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalVolume = activeWorkout.exercises.reduce(
    (sum, ex) =>
      sum + ex.sets.filter((s) => s.completed).reduce((v, s) => v + s.weight * s.reps, 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Workout header */}
      <Card className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-200">{activeWorkout.name}</h2>
          <div className="flex gap-4 text-xs text-gray-500 mt-1">
            <span>{activeWorkout.exercises.length} exercises</span>
            <span>{totalSets} sets done</span>
            <span>{totalVolume.toLocaleString()} {profile?.preferences.weightUnit || 'lbs'} volume</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowRestTimer(!showRestTimer)}>
            <Timer size={16} />
          </Button>
          <Button variant="danger" size="sm" onClick={handleDiscard}>
            Discard
          </Button>
          <Button size="sm" onClick={handleFinish} loading={saving}>
            Finish
          </Button>
        </div>
      </Card>

      {/* Rest timer */}
      {showRestTimer && (
        <RestTimer
          defaultSeconds={90}
          onComplete={() => setShowRestTimer(false)}
        />
      )}

      {/* Exercises */}
      {(() => {
        // Group exercises by category
        const warmupExercises = activeWorkout.exercises.map((ex, idx) => ({ ex, idx }))
          .filter(({ ex }) => ex.exercise.category === 'warmup');
        const mainExercises = activeWorkout.exercises.map((ex, idx) => ({ ex, idx }))
          .filter(({ ex }) => !['warmup', 'stretch'].includes(ex.exercise.category));
        const cooldownExercises = activeWorkout.exercises.map((ex, idx) => ({ ex, idx }))
          .filter(({ ex }) => ex.exercise.category === 'stretch');

        return (
          <>
            {/* Warmup section */}
            {warmupExercises.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
                  <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Warmup</h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-orange-500/30 to-transparent" />
                </div>
                {warmupExercises.map(({ ex, idx: exIndex }) => (
                  <Card key={exIndex} className="bg-orange-950/20 border-orange-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-300">{ex.exercise.name}</h3>
                        {ex.exercise.duration && (
                          <p className="text-xs text-gray-500 mt-0.5">{ex.exercise.duration}s</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeExercise(exIndex)}
                        className="text-xs text-gray-600 hover:text-gray-400 px-2"
                      >
                        Skip
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Main exercises section */}
            {mainExercises.length > 0 && (
              <div className="space-y-2">
                {warmupExercises.length > 0 && (
                  <div className="flex items-center gap-2 px-2 mt-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
                    <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Main Workout</h3>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-red-500/30 to-transparent" />
                  </div>
                )}
                {mainExercises.map(({ ex, idx: exIndex }) => (
                  <Card key={exIndex}>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedExercise(expandedExercise === exIndex ? null : exIndex)}
                    >
                      <div>
                        <h3 className="font-semibold text-gray-200">{ex.exercise.name}</h3>
                        <div className="flex gap-1.5 mt-1">
                          {ex.exercise.muscleGroup.map((mg) => (
                            <span key={mg} className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                              {mg}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Reorder buttons */}
                        <div className="flex flex-col">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (exIndex > 0) moveExercise(exIndex, exIndex - 1);
                            }}
                            disabled={exIndex === 0}
                            className="text-gray-600 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (exIndex < activeWorkout.exercises.length - 1)
                                moveExercise(exIndex, exIndex + 1);
                            }}
                            disabled={exIndex === activeWorkout.exercises.length - 1}
                            className="text-gray-600 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                        <span className="text-xs text-gray-500">
                          {ex.sets.filter((s) => s.completed).length}/{ex.sets.length}
                        </span>
                        {expandedExercise === exIndex ? (
                          <ChevronUp size={16} className="text-gray-500" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-500" />
                        )}
                      </div>
                    </div>

                    {expandedExercise === exIndex && (
                      <div className="mt-4 space-y-3">
                        <SetTracker
                          sets={ex.sets}
                          onUpdateSet={(setIndex, data) => updateSet(exIndex, setIndex, data)}
                          onAddSet={() => addSet(exIndex)}
                          onRemoveSet={(setIndex) => removeSet(exIndex, setIndex)}
                          suggestion={historyLoaded ? getSuggestionFor(ex.exerciseId || ex.exercise?.id) : null}
                          history={historyLoaded ? getHistory(ex.exerciseId || ex.exercise?.id) : null}
                          weightUnit={profile?.preferences.weightUnit || 'lbs'}
                          exercise={ex.exercise}
                          defaultRestSeconds={ex.sets[0]?.restSeconds || 90}
                        />
                        <button
                          onClick={() => removeExercise(exIndex)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove Exercise
                        </button>
                        {/* Exercise notes */}
                        <textarea
                          placeholder="Notes for this exercise (e.g. form cues, pain)..."
                          value={ex.notes || ''}
                          onChange={(e) => updateExerciseNotes(exIndex, e.target.value)}
                          className="w-full bg-gray-800 rounded-lg p-2 text-xs text-gray-300 placeholder-gray-600 resize-none border border-gray-700 focus:border-red-500 outline-none"
                          rows={2}
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Cooldown section */}
            {cooldownExercises.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 mt-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Cooldown & Stretching</h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-blue-500/30 to-transparent" />
                </div>
                {cooldownExercises.map(({ ex, idx: exIndex }) => (
                  <Card key={exIndex} className="bg-blue-950/20 border-blue-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-300">{ex.exercise.name}</h3>
                        {ex.exercise.duration && (
                          <p className="text-xs text-gray-500 mt-0.5">{ex.exercise.duration}s hold (each side if applicable)</p>
                        )}
                        {ex.exercise.muscleGroup.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {ex.exercise.muscleGroup.map((mg) => (
                              <span key={mg} className="text-[10px] bg-blue-900/30 text-blue-400/70 px-1.5 py-0.5 rounded">
                                {mg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeExercise(exIndex)}
                        className="text-xs text-gray-600 hover:text-gray-400 px-2"
                      >
                        Skip
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        );
      })()}

      {/* Add exercise button */}
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => setShowExerciseModal(true)}
      >
        <Plus size={16} /> Add Exercise
      </Button>

      {/* Exercise picker modal */}
      <Modal
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        title="Add Exercise"
        size="lg"
      >
        <ExerciseList onSelect={handleAddExercise} />
      </Modal>
    </div>
  );
}
