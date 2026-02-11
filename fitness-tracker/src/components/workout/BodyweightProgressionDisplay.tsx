import { TrendingUp, TrendingDown, ArrowRight, RefreshCw } from 'lucide-react';
import type { AdaptationRecommendation } from '../../services/progression.service';
import { getBodyweightProgressionPath } from '../../services/bodyweightAdaptation.service';

interface BodyweightProgressionDisplayProps {
  exerciseId: string;
  exerciseName: string;
  adaptation?: AdaptationRecommendation | null;
}

export function BodyweightProgressionDisplay({
  exerciseId,
  exerciseName,
  adaptation,
}: BodyweightProgressionDisplayProps) {
  const progressionPath = getBodyweightProgressionPath(exerciseId);

  if (!progressionPath && !adaptation) return null;

  return (
    <div className="space-y-2">
      {/* Adaptation Recommendation */}
      {adaptation && (
        <div
          className={`rounded-lg px-3 py-2 text-xs ${
            adaptation.adaptationType === 'progress-variation'
              ? 'bg-green-900/20 text-green-400 border border-green-500/20'
              : adaptation.adaptationType === 'regress-variation'
              ? 'bg-orange-900/20 text-orange-400 border border-orange-500/20'
              : adaptation.adaptationType === 'swap-exercise'
              ? 'bg-blue-900/20 text-blue-400 border border-blue-500/20'
              : 'bg-gray-800/60 text-gray-400 border border-gray-700'
          }`}
        >
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              {adaptation.adaptationType === 'progress-variation' && <TrendingUp size={14} />}
              {adaptation.adaptationType === 'regress-variation' && <TrendingDown size={14} />}
              {adaptation.adaptationType === 'swap-exercise' && <RefreshCw size={14} />}
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-medium">{adaptation.reason}</p>
              {adaptation.progressionVariation && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-gray-500">{exerciseName}</span>
                  <ArrowRight size={12} />
                  <span className="font-semibold">{adaptation.progressionVariation.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progression Path */}
      {progressionPath && (
        <div className="bg-gray-800/40 rounded-lg px-3 py-2">
          <div className="text-[10px] text-gray-500 font-medium mb-1.5">PROGRESSION PATH</div>
          <div className="space-y-1 text-xs">
            {progressionPath.easier && (
              <div className="flex items-center gap-1.5 text-orange-400/70">
                <TrendingDown size={12} />
                <span>Easier: {progressionPath.easier}</span>
              </div>
            )}
            {progressionPath.harder && (
              <div className="flex items-center gap-1.5 text-green-400/70">
                <TrendingUp size={12} />
                <span>Harder: {progressionPath.harder}</span>
              </div>
            )}
            {progressionPath.alternatives && progressionPath.alternatives.length > 0 && (
              <div className="flex items-center gap-1.5 text-blue-400/70">
                <RefreshCw size={12} />
                <span>
                  Variations: {progressionPath.alternatives.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
