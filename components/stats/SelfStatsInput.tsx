'use client';

import type { SelfStats } from '@/types';
import AbilityInput from './AbilityInput';
import BarrierAilmentsInput from './BarrierAilmentsInput';

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
  const set = (field: keyof SelfStats) => (v: any) =>
    onChange({ ...stats, [field]: v });

  return (
    <div className="space-y-6">
      {/* 基本ステータス */}
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

      {/* 結界異常 */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wider">
          自身の結界異常
        </h4>
        <BarrierAilmentsInput
          barriers={stats.barriers}
          maxBarriers={5}
          nullifyAilments={stats.ability.nullifyAilments}
          onChange={set('barriers')}
        />
      </div>

      {/* 能力設定 */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wider">
          能力（バフ変換・無効化）
        </h4>
        <AbilityInput ability={stats.ability} onChange={set('ability')} />
      </div>
    </div>
  );
}
