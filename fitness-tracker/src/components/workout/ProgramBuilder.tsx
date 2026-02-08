import { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { useWorkoutStore } from '../../store/workoutStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Plus, Trash2, Play, Star, Sparkles, Edit, Save, GripVertical, X } from 'lucide-react';
import { ProgramWizard } from './ProgramWizard';
import { ExerciseList } from './ExerciseList';
import {
  saveProgram,
  getPrograms,
  deleteProgram,
  setActiveProgram,
  type SavedProgram,
  type SavedProgramDay,
} from '../../services/program.service';
import type { GeneratedProgram } from '../../utils/programGenerator';
import type { Exercise } from '../../types/workout.types';

export function ProgramBuilder() {
  const { user } = useAuthStore();
  const { startWorkout, addExercise, addSet } = useWorkoutStore();
  const { addToast } = useToastStore();

  const [programs, setPrograms] = useState<SavedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingProgram, setEditingProgram] = useState<SavedProgram | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Load programs from Firestore
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getPrograms(user!.uid);
        if (!cancelled) setPrograms(data);
      } catch (error) {
        console.error('Failed to load programs:', error);
        try {
          const saved = localStorage.getItem('workout-programs');
          if (saved && !cancelled) {
            const local = JSON.parse(saved) as SavedProgram[];
            setPrograms(local);
          }
        } catch { /* ignore */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  const handleWizardComplete = async (generated: GeneratedProgram) => {
    if (!user) return;

    const program: SavedProgram = {
      id: `prog-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: generated.name,
      description: generated.description,
      days: generated.days.map((d) => ({
        name: d.name,
        exercises: d.exercises.map((ex) => ({
          exerciseId: ex.exercise.id,
          exerciseName: ex.exercise.name,
          muscleGroup: ex.exercise.muscleGroup,
          sets: ex.sets,
          repsMin: ex.repsMin,
          repsMax: ex.repsMax,
          restSeconds: ex.restSeconds,
        })),
      })),
      createdBy: user.uid,
      createdAt: new Date(),
      isActive: programs.length === 0,
    };

    try {
      await saveProgram(user.uid, program);
      setPrograms([program, ...programs]);
      localStorage.setItem('workout-programs', JSON.stringify([program, ...programs]));
      addToast({ type: 'success', message: `"${program.name}" created!` });
    } catch (error) {
      console.error('Failed to save program:', error);
      addToast({ type: 'error', message: 'Failed to save program' });
    }

    setShowWizard(false);
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('Delete this program?')) return;
    try {
      await deleteProgram(user.uid, id);
      const updated = programs.filter((p) => p.id !== id);
      setPrograms(updated);
      localStorage.setItem('workout-programs', JSON.stringify(updated));
      addToast({ type: 'success', message: 'Program deleted' });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete program' });
    }
  };

  const handleSetActive = async (id: string) => {
    if (!user) return;
    try {
      await setActiveProgram(user.uid, id, programs);
      setPrograms(programs.map((p) => ({ ...p, isActive: p.id === id })));
      addToast({ type: 'success', message: 'Active program updated' });
    } catch {
      addToast({ type: 'error', message: 'Failed to update active program' });
    }
  };

  const handleStartDay = (day: SavedProgramDay) => {
    startWorkout(day.name);
    day.exercises.forEach((ex, i) => {
      const exercise: Exercise = {
        id: ex.exerciseId,
        name: ex.exerciseName,
        category: 'compound',
        muscleGroup: ex.muscleGroup,
        equipment: [],
        difficulty: 'intermediate',
      };
      addExercise(exercise);
      for (let s = 1; s < ex.sets; s++) {
        addSet(i);
      }
    });
    addToast({ type: 'success', message: `Started: ${day.name}` });
  };

  const handleEdit = (program: SavedProgram) => {
    setEditingProgram(program);
    setShowEditor(true);
  };

  const handleSaveEdit = async (program: SavedProgram) => {
    if (!user) return;
    try {
      await saveProgram(user.uid, program);
      setPrograms(programs.map((p) => (p.id === program.id ? program : p)));
      addToast({ type: 'success', message: 'Program updated' });
    } catch {
      addToast({ type: 'error', message: 'Failed to update program' });
    }
    setShowEditor(false);
    setEditingProgram(null);
  };

  if (showWizard) {
    return (
      <ProgramWizard
        onComplete={handleWizardComplete}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">Loading programs...</div>
      </Card>
    );
  }

  if (programs.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <Sparkles size={36} className="mx-auto mb-3 text-red-400" />
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Program Builder</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
            Answer a few questions and we'll generate a personalized workout program
            tailored to your goals, experience, and equipment.
          </p>
          <Button onClick={() => setShowWizard(true)}>
            <Sparkles size={16} /> Build My Program
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Your Programs</h3>
        <Button size="sm" onClick={() => setShowWizard(true)}>
          <Plus size={14} /> New Program
        </Button>
      </div>

      {programs.map((program) => (
        <Card key={program.id} className={program.isActive ? 'ring-1 ring-red-500/50' : ''}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-200">{program.name}</h4>
                {program.isActive && (
                  <span className="text-[10px] text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded font-medium">
                    ACTIVE
                  </span>
                )}
              </div>
              {program.description && (
                <p className="text-xs text-gray-500 mt-0.5">{program.description}</p>
              )}
            </div>
            <div className="flex gap-1">
              {!program.isActive && (
                <button
                  onClick={() => handleSetActive(program.id)}
                  className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-gray-700 rounded transition-colors"
                  title="Set as active"
                >
                  <Star size={16} />
                </button>
              )}
              <button
                onClick={() => handleEdit(program)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Edit"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(program.id)}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {program.days.map((day, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-900 rounded-lg p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200">{day.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {day.exercises.map((ex) => ex.exerciseName).join(' · ') || 'No exercises'}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    {day.exercises.length} exercises · {day.exercises.reduce((a, e) => a + e.sets, 0)} sets
                  </div>
                </div>
                <Button size="sm" onClick={() => handleStartDay(day)} className="ml-3 flex-shrink-0">
                  <Play size={14} /> Start
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {showEditor && editingProgram && (
        <ProgramEditor
          program={editingProgram}
          onSave={handleSaveEdit}
          onClose={() => { setShowEditor(false); setEditingProgram(null); }}
        />
      )}
    </div>
  );
}

// ── Inline Program Editor ──────────────────────────────────────────────────

function ProgramEditor({ program, onSave, onClose }: {
  program: SavedProgram;
  onSave: (p: SavedProgram) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(program.name);
  const [days, setDays] = useState<SavedProgramDay[]>(JSON.parse(JSON.stringify(program.days)));
  const [showExercisePicker, setShowExercisePicker] = useState<number | null>(null);

  const handleAddExercise = (dayIndex: number, exercise: Exercise) => {
    const updated = [...days];
    updated[dayIndex].exercises.push({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      restSeconds: 90,
    });
    setDays(updated);
    setShowExercisePicker(null);
  };

  const handleRemoveExercise = (dayIndex: number, exIndex: number) => {
    const updated = [...days];
    updated[dayIndex].exercises = updated[dayIndex].exercises.filter((_, i) => i !== exIndex);
    setDays(updated);
  };

  const handleUpdateField = (dayIndex: number, exIndex: number, field: string, value: number) => {
    const updated = [...days];
    (updated[dayIndex].exercises[exIndex] as Record<string, unknown>)[field] = value;
    setDays(updated);
  };

  const handleAddDay = () => {
    setDays([...days, { name: `Day ${days.length + 1}`, exercises: [] }]);
  };

  const handleRemoveDay = (index: number) => {
    setDays(days.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({ ...program, name, days });
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Program" size="xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-red-500/50 focus:outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Program name"
          />
        </div>

        {days.map((day, dayIndex) => (
          <Card key={dayIndex}>
            <div className="flex items-center justify-between mb-3">
              <input
                className="bg-transparent text-white font-semibold text-sm border-b border-gray-700 focus:border-red-500 outline-none pb-1"
                value={day.name}
                onChange={(e) => {
                  const updated = [...days];
                  updated[dayIndex].name = e.target.value;
                  setDays(updated);
                }}
              />
              {days.length > 1 && (
                <button
                  onClick={() => handleRemoveDay(dayIndex)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {day.exercises.map((ex, exIndex) => (
              <div key={exIndex} className="flex items-center gap-2 py-2 border-b border-gray-800 last:border-0">
                <GripVertical size={14} className="text-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 truncate">{ex.exerciseName}</div>
                  <div className="flex gap-2 mt-1">
                    <label className="text-[10px] text-gray-500">
                      Sets
                      <input
                        type="number"
                        className="block w-12 mt-0.5 bg-gray-800 rounded px-1.5 py-1 text-xs text-white"
                        value={ex.sets}
                        onChange={(e) => handleUpdateField(dayIndex, exIndex, 'sets', +e.target.value)}
                        min={1}
                      />
                    </label>
                    <label className="text-[10px] text-gray-500">
                      Reps
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          className="w-12 bg-gray-800 rounded px-1.5 py-1 text-xs text-white"
                          value={ex.repsMin}
                          onChange={(e) => handleUpdateField(dayIndex, exIndex, 'repsMin', +e.target.value)}
                          min={1}
                        />
                        <span className="text-gray-600">-</span>
                        <input
                          type="number"
                          className="w-12 bg-gray-800 rounded px-1.5 py-1 text-xs text-white"
                          value={ex.repsMax}
                          onChange={(e) => handleUpdateField(dayIndex, exIndex, 'repsMax', +e.target.value)}
                          min={1}
                        />
                      </div>
                    </label>
                    <label className="text-[10px] text-gray-500">
                      Rest
                      <input
                        type="number"
                        className="block w-14 mt-0.5 bg-gray-800 rounded px-1.5 py-1 text-xs text-white"
                        value={ex.restSeconds}
                        onChange={(e) => handleUpdateField(dayIndex, exIndex, 'restSeconds', +e.target.value)}
                        min={0}
                        step={15}
                      />
                    </label>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveExercise(dayIndex, exIndex)}
                  className="text-red-400 hover:text-red-300 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setShowExercisePicker(dayIndex)}>
              <Plus size={14} /> Add Exercise
            </Button>
          </Card>
        ))}

        <Button variant="secondary" className="w-full" onClick={handleAddDay}>
          <Plus size={14} /> Add Day
        </Button>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} className="flex-1">
            <Save size={14} /> Save Changes
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showExercisePicker !== null}
        onClose={() => setShowExercisePicker(null)}
        title="Add Exercise"
        size="lg"
      >
        <ExerciseList
          onSelect={(exercise) => {
            if (showExercisePicker !== null) handleAddExercise(showExercisePicker, exercise);
          }}
        />
      </Modal>
    </Modal>
  );
}
