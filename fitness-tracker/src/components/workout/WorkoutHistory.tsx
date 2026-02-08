import { Card } from '../shared/Card';
import { Calendar, Clock, Dumbbell } from 'lucide-react';
import { useWorkoutStore } from '../../store/workoutStore';
import { formatDuration } from '../../utils/dateHelpers';
import type { Workout } from '../../types/workout.types';

export function WorkoutHistory() {
  const { workoutHistory } = useWorkoutStore();

  if (workoutHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <Dumbbell className="mx-auto text-gray-700 mb-3" size={40} />
        <p className="text-gray-500">No workouts yet</p>
        <p className="text-xs text-gray-600 mt-1">
          Start a workout to see your history here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">Recent Workouts</h3>
      {workoutHistory.map((workout) => (
        <WorkoutHistoryCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}

function WorkoutHistoryCard({ workout }: { workout: Workout }) {
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalVolume = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((v, s) => v + s.weight * s.reps, 0),
    0
  );
  const date = new Date(workout.date);

  return (
    <Card hoverable>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-200">{workout.name}</h4>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {workout.exercises.map((ex, i) => (
              <span
                key={i}
                className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded"
              >
                {ex.exercise.name}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-1 justify-end">
            <Calendar size={12} />
            {date.toLocaleDateString()}
          </div>
          {workout.duration && (
            <div className="flex items-center gap-1 justify-end">
              <Clock size={12} />
              {formatDuration(workout.duration)}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-800 text-xs text-gray-400">
        <span>{workout.exercises.length} exercises</span>
        <span>{totalSets} sets</span>
        <span>{totalVolume.toLocaleString()} kg volume</span>
      </div>
    </Card>
  );
}
