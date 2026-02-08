import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { WorkoutLogger } from '../components/workout/WorkoutLogger';
import { WorkoutHistory } from '../components/workout/WorkoutHistory';
import { ProgramBuilder } from '../components/workout/ProgramBuilder';

type Tab = 'log' | 'history' | 'programs';

export default function WorkoutPage() {
  const [activeTab, setActiveTab] = useState<Tab>('log');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'log', label: 'Log Workout' },
    { id: 'history', label: 'History' },
    { id: 'programs', label: 'Programs' },
  ];

  return (
    <div className="space-y-6">
      <Header title="Workout" subtitle="Track your training" />

      <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-800 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'log' && <WorkoutLogger />}
      {activeTab === 'history' && <WorkoutHistory />}
      {activeTab === 'programs' && <ProgramBuilder />}
    </div>
  );
}
