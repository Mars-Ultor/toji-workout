import { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';

import {
  Dumbbell, Target, Clock, Zap, ChevronRight, ChevronLeft,
  Check, Sparkles, RotateCcw, Loader2, Home, Building2, Wrench,
} from 'lucide-react';
import { MUSCLE_GROUPS, EQUIPMENT } from '../../utils/constants';
import { EQUIPMENT_PRESETS } from '../../services/exercisedb.service';
import {
  generateProgram,
  suggestSplit,
  type ProgramWizardAnswers,
  type GeneratedProgram,
} from '../../utils/programGenerator';

type Step = 'goal' | 'experience' | 'days' | 'session' | 'equipment' | 'focus' | 'split' | 'review';

const STEPS: Step[] = ['goal', 'experience', 'days', 'session', 'equipment', 'focus', 'split', 'review'];

interface ProgramWizardProps {
  onComplete: (program: GeneratedProgram) => void;
  onCancel: () => void;
}

export function ProgramWizard({ onComplete, onCancel }: ProgramWizardProps) {
  const [step, setStep] = useState<Step>('goal');
  const [answers, setAnswers] = useState<ProgramWizardAnswers>({
    goal: 'hypertrophy',
    experience: 'intermediate',
    daysPerWeek: 4,
    sessionLength: 'medium',
    equipment: ['Barbell', 'Dumbbell', 'Bodyweight'],
    focusMuscles: [],
    split: 'auto',
  });
  const [preview, setPreview] = useState<GeneratedProgram | null>(null);
  const [generating, setGenerating] = useState(false);

  const currentIndex = STEPS.indexOf(step);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  const goNext = async () => {
    const next = STEPS[currentIndex + 1];
    if (next === 'review') {
      setGenerating(true);
      setStep(next);
      try {
        const program = await generateProgram(answers);
        setPreview(program);
      } catch (err) {
        console.error('Failed to generate program:', err);
      } finally {
        setGenerating(false);
      }
    } else {
      setStep(next);
    }
  };

  const goBack = () => {
    setStep(STEPS[currentIndex - 1]);
  };

  const regenerate = async () => {
    setGenerating(true);
    try {
      const program = await generateProgram(answers);
      setPreview(program);
    } catch (err) {
      console.error('Failed to regenerate program:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (preview) onComplete(preview);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 'equipment': return answers.equipment.length > 0;
      default: return true;
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Step {currentIndex + 1} of {STEPS.length}</span>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-300">
            Cancel
          </button>
        </div>
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      {step === 'goal' && (
        <StepGoal value={answers.goal} onChange={(goal) => setAnswers({ ...answers, goal })} />
      )}
      {step === 'experience' && (
        <StepExperience value={answers.experience} onChange={(experience) => setAnswers({ ...answers, experience })} />
      )}
      {step === 'days' && (
        <StepDays value={answers.daysPerWeek} onChange={(daysPerWeek) => setAnswers({ ...answers, daysPerWeek })} />
      )}
      {step === 'session' && (
        <StepSession value={answers.sessionLength} onChange={(sessionLength) => setAnswers({ ...answers, sessionLength })} />
      )}
      {step === 'equipment' && (
        <StepEquipment value={answers.equipment} onChange={(equipment) => setAnswers({ ...answers, equipment })} />
      )}
      {step === 'focus' && (
        <StepFocus value={answers.focusMuscles} onChange={(focusMuscles) => setAnswers({ ...answers, focusMuscles })} />
      )}
      {step === 'split' && (
        <StepSplit
          value={answers.split}
          onChange={(split) => setAnswers({ ...answers, split })}
          suggested={suggestSplit(answers.daysPerWeek, answers.experience)}
        />
      )}
      {step === 'review' && preview && (
        <StepReview program={preview} onRegenerate={regenerate} generating={generating} />
      )}
      {step === 'review' && !preview && generating && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 size={24} className="animate-spin text-red-400" />
          <p className="text-sm text-gray-400">Building your program...</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {currentIndex > 0 && (
          <Button variant="secondary" onClick={goBack} className="flex-1">
            <ChevronLeft size={16} /> Back
          </Button>
        )}
        {step !== 'review' ? (
          <Button onClick={goNext} disabled={!canProceed() || generating} className="flex-1">
            {generating ? (
              <><Loader2 size={16} className="animate-spin" /> Generating...</>
            ) : (
              <>Next <ChevronRight size={16} /></>
            )}
          </Button>
        ) : (
          <Button onClick={handleConfirm} disabled={!preview || generating} className="flex-1">
            <Check size={16} /> Use This Program
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Step Components ────────────────────────────────────────────────────────

function StepGoal({ value, onChange }: { value: string; onChange: (v: ProgramWizardAnswers['goal']) => void }) {
  const options: { id: ProgramWizardAnswers['goal']; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'strength', label: 'Strength', desc: 'Heavy weights, low reps. Get stronger.', icon: <Dumbbell size={20} /> },
    { id: 'hypertrophy', label: 'Muscle Growth', desc: 'Moderate reps, maximize muscle size.', icon: <Zap size={20} /> },
    { id: 'endurance', label: 'Endurance', desc: 'High reps, build stamina.', icon: <Clock size={20} /> },
    { id: 'general', label: 'General Fitness', desc: 'Balanced approach for overall health.', icon: <Target size={20} /> },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">What's your goal?</h3>
      <p className="text-sm text-gray-500 mb-4">This determines your rep ranges, sets, and rest periods.</p>
      <div className="space-y-2">
        {options.map((opt) => (
          <OptionCard
            key={opt.id}
            selected={value === opt.id}
            onClick={() => onChange(opt.id)}
            icon={opt.icon}
            label={opt.label}
            description={opt.desc}
          />
        ))}
      </div>
    </div>
  );
}

function StepExperience({ value, onChange }: { value: string; onChange: (v: ProgramWizardAnswers['experience']) => void }) {
  const options: { id: ProgramWizardAnswers['experience']; label: string; desc: string }[] = [
    { id: 'beginner', label: 'Beginner', desc: 'Less than 1 year of consistent training.' },
    { id: 'intermediate', label: 'Intermediate', desc: '1-3 years of consistent training.' },
    { id: 'advanced', label: 'Advanced', desc: '3+ years with solid technique.' },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">What's your experience level?</h3>
      <p className="text-sm text-gray-500 mb-4">This adjusts exercise selection and complexity.</p>
      <div className="space-y-2">
        {options.map((opt) => (
          <OptionCard
            key={opt.id}
            selected={value === opt.id}
            onClick={() => onChange(opt.id)}
            label={opt.label}
            description={opt.desc}
          />
        ))}
      </div>
    </div>
  );
}

function StepDays({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">How many days per week?</h3>
      <p className="text-sm text-gray-500 mb-4">We'll recommend the best split for your schedule.</p>
      <div className="grid grid-cols-3 gap-2">
        {[2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`py-4 rounded-lg text-center transition-colors border ${
              value === n
                ? 'bg-red-500/20 border-red-500 text-white'
                : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="text-2xl font-bold">{n}</div>
            <div className="text-[10px] text-gray-500">days</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepSession({ value, onChange }: { value: string; onChange: (v: ProgramWizardAnswers['sessionLength']) => void }) {
  const options: { id: ProgramWizardAnswers['sessionLength']; label: string; desc: string }[] = [
    { id: 'short', label: '30-45 min', desc: 'Quick and focused. 4 exercises max.' },
    { id: 'medium', label: '45-60 min', desc: 'Balanced. 5-6 exercises per session.' },
    { id: 'long', label: '60-90 min', desc: 'Thorough. 7-8 exercises, more volume.' },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">How long can you train?</h3>
      <p className="text-sm text-gray-500 mb-4">Determines how many exercises per session.</p>
      <div className="space-y-2">
        {options.map((opt) => (
          <OptionCard
            key={opt.id}
            selected={value === opt.id}
            onClick={() => onChange(opt.id)}
            label={opt.label}
            description={opt.desc}
          />
        ))}
      </div>
    </div>
  );
}

function StepEquipment({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [showCustom, setShowCustom] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const presets = [
    { id: 'bodyweight', icon: <Dumbbell size={16} />, ...EQUIPMENT_PRESETS.bodyweight },
    { id: 'homeBasic', icon: <Home size={16} />, ...EQUIPMENT_PRESETS.homeBasic },
    { id: 'homeComplete', icon: <Wrench size={16} />, ...EQUIPMENT_PRESETS.homeComplete },
    { id: 'commercialGym', icon: <Building2 size={16} />, ...EQUIPMENT_PRESETS.commercialGym },
  ];

  const handlePreset = (presetId: string, equipment: string[]) => {
    setActivePreset(presetId);
    setShowCustom(false);
    onChange(equipment);
  };

  const handleCustom = () => {
    setActivePreset(null);
    setShowCustom(true);
  };

  const toggle = (item: string) => {
    setActivePreset(null); // Clear preset selection when manually toggling
    if (value.includes(item)) {
      onChange(value.filter((v) => v !== item));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">What equipment do you have?</h3>
      <p className="text-sm text-gray-500 mb-4">Choose a preset or customize your own selection.</p>

      {/* Presets */}
      <div className="space-y-2 mb-4">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePreset(preset.id, preset.equipment)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors border flex items-center gap-3 ${
              activePreset === preset.id
                ? 'bg-red-500/15 border-red-500 text-white'
                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600'
            }`}
          >
            <div className={`flex-shrink-0 ${activePreset === preset.id ? 'text-red-400' : 'text-gray-500'}`}>
              {preset.icon}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{preset.label}</div>
              <div className="text-xs text-gray-500">{preset.description}</div>
            </div>
            {activePreset === preset.id && <Check size={16} className="text-red-400 flex-shrink-0" />}
          </button>
        ))}
      </div>

      {/* Custom toggle */}
      <button
        onClick={handleCustom}
        className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors border text-sm ${
          showCustom || (!activePreset && value.length > 0)
            ? 'bg-red-500/15 border-red-500 text-white'
            : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
        }`}
      >
        Custom selection ({value.length} selected)
      </button>

      {/* Custom equipment grid */}
      {(showCustom || (!activePreset && value.length > 0 && !presets.some(p => p.id === activePreset))) && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {EQUIPMENT.map((eq) => (
            <button
              key={eq}
              onClick={() => toggle(eq)}
              className={`py-3 px-3 rounded-lg text-sm text-left transition-colors border flex items-center gap-2 ${
                value.includes(eq)
                  ? 'bg-red-500/20 border-red-500 text-white'
                  : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {value.includes(eq) && <Check size={14} className="text-red-400 flex-shrink-0" />}
              <span className={!value.includes(eq) ? 'ml-5' : ''}>{eq}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StepFocus({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter((v) => v !== item));
    } else if (value.length < 3) {
      onChange([...value, item]);
    }
  };

  const mainGroups = MUSCLE_GROUPS.filter((mg) => mg !== 'Full Body' && mg !== 'Forearms');

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">Any muscles to emphasize?</h3>
      <p className="text-sm text-gray-500 mb-4">Pick up to 3 (optional). These get extra volume.</p>
      <div className="grid grid-cols-2 gap-2">
        {mainGroups.map((mg) => (
          <button
            key={mg}
            onClick={() => toggle(mg)}
            className={`py-2.5 px-3 rounded-lg text-sm text-left transition-colors border flex items-center gap-2 ${
              value.includes(mg)
                ? 'bg-red-500/20 border-red-500 text-white'
                : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            {value.includes(mg) && <Check size={14} className="text-red-400 flex-shrink-0" />}
            <span className={!value.includes(mg) ? 'ml-5' : ''}>{mg}</span>
          </button>
        ))}
      </div>
      {value.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="mt-2 text-xs text-gray-500 hover:text-gray-300"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}

function StepSplit({ value, onChange, suggested }: {
  value: string;
  onChange: (v: ProgramWizardAnswers['split']) => void;
  suggested: ProgramWizardAnswers['split'];
}) {
  const options: { id: ProgramWizardAnswers['split']; label: string; desc: string }[] = [
    { id: 'auto', label: 'Auto (Recommended)', desc: `We'll pick the best split for you.` },
    { id: 'full-body', label: 'Full Body', desc: 'Train every muscle each session. Best for 2-3 days.' },
    { id: 'upper-lower', label: 'Upper / Lower', desc: 'Alternate upper and lower body. Best for 4 days.' },
    { id: 'push-pull-legs', label: 'Push / Pull / Legs', desc: 'Hit each pattern twice. Best for 5-6 days.' },
    { id: 'bro-split', label: 'Bro Split', desc: 'One muscle group per day. Maximum focus.' },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">Choose your training split</h3>
      <p className="text-sm text-gray-500 mb-4">
        Or let us pick — we'd suggest <span className="text-red-400 font-medium">
          {options.find((o) => o.id === suggested)?.label}
        </span>.
      </p>
      <div className="space-y-2">
        {options.map((opt) => (
          <OptionCard
            key={opt.id}
            selected={value === opt.id}
            onClick={() => onChange(opt.id)}
            label={opt.label}
            description={opt.desc}
          />
        ))}
      </div>
    </div>
  );
}

function StepReview({ program, onRegenerate, generating }: { program: GeneratedProgram; onRegenerate: () => void; generating: boolean }) {
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles size={18} className="text-red-400" />
          Your Program
        </h3>
        <button
          onClick={onRegenerate}
          disabled={generating}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 disabled:opacity-50"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
          {generating ? 'Generating...' : 'Regenerate'}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">{program.description}</p>

      <div className="space-y-2">
        {program.days.map((day, dayIndex) => (
          <Card key={dayIndex} className="!p-0 overflow-hidden">
            <button
              onClick={() => setExpandedDay(expandedDay === dayIndex ? null : dayIndex)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div>
                <div className="text-sm font-semibold text-white">{day.name}</div>
                <div className="text-xs text-gray-500">
                  {day.exercises.length} exercises · {day.exercises.reduce((a, e) => a + e.sets, 0)} sets
                </div>
              </div>
              <ChevronRight
                size={16}
                className={`text-gray-500 transition-transform ${expandedDay === dayIndex ? 'rotate-90' : ''}`}
              />
            </button>
            {expandedDay === dayIndex && (
              <div className="px-4 pb-3 space-y-2 border-t border-gray-800">
                {day.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200 truncate">{ex.exercise.name}</div>
                      <div className="text-[10px] text-gray-500">
                        {ex.exercise.muscleGroup.join(', ')}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 text-right flex-shrink-0 ml-2">
                      <div>{ex.sets} × {ex.repsMin}-{ex.repsMax}</div>
                      <div className="text-[10px] text-gray-600">{ex.restSeconds}s rest</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Shared Option Card ─────────────────────────────────────────────────────

function OptionCard({ selected, onClick, label, description, icon }: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg transition-colors border flex items-center gap-3 ${
        selected
          ? 'bg-red-500/15 border-red-500 text-white'
          : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600'
      }`}
    >
      {icon && <div className={`flex-shrink-0 ${selected ? 'text-red-400' : 'text-gray-500'}`}>{icon}</div>}
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      {selected && <Check size={16} className="text-red-400 flex-shrink-0" />}
    </button>
  );
}
