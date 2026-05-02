'use client';

import type { EnemyStats } from '@/types';

interface Props {
  stats: EnemyStats;
  onChange: (stats: EnemyStats) => void;
}

export default function EnemyStatsInput({ stats, onChange }: Props) {
  const set = (field: keyof EnemyStats) => (v: number) =>
    onChange({ ...stats, [field]: v });

  return (
    <div className="space-y-2">
      {(['yangDefense', 'yinDefense'] as const).map((field) => (
        <div key={field} className="flex items-center gap-3">
          <label className="w-12 text-right text-sm text-gray-500 dark:text-gray-400 shrink-0">
            {field === 'yangDefense' ? '陽防' : '陰防'}
          </label>
          <input
            type="number"
            min={1}
            value={stats[field]}
            onChange={(e) => set(field)(Number(e.target.value))}
            className="w-32 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
          />
        </div>
      ))}
    </div>
  );
}
