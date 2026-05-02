'use client';

import type { SelfStats } from '@/types';

interface Props {
  stats: SelfStats;
  onChange: (stats: SelfStats) => void;
}

function StatRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-12 text-right text-sm text-gray-500 dark:text-gray-400 shrink-0">
        {label}
      </label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
      />
    </div>
  );
}

export default function SelfStatsInput({ stats, onChange }: Props) {
  const set = (field: keyof SelfStats) => (v: number) =>
    onChange({ ...stats, [field]: v });

  return (
    <div className="space-y-2">
      <StatRow
        label="陽攻"
        value={stats.yangAttack}
        onChange={set('yangAttack')}
      />
      <StatRow
        label="陰攻"
        value={stats.yinAttack}
        onChange={set('yinAttack')}
      />
      <StatRow label="速力" value={stats.speed} onChange={set('speed')} />
      <StatRow
        label="陽防"
        value={stats.yangDefense}
        onChange={set('yangDefense')}
      />
      <StatRow
        label="陰防"
        value={stats.yinDefense}
        onChange={set('yinDefense')}
      />
    </div>
  );
}
