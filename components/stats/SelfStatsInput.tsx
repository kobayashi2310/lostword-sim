'use client';

import type { CharacterClass, SelfStats, StoryCard } from '@/types';
import AbilityInput from './AbilityInput';
import BarrierAilmentsInput from './BarrierAilmentsInput';

interface Props {
  stats: SelfStats;
  onChange: (stats: SelfStats) => void;
  equippedStoryCards: (StoryCard | null)[];
}

const ALL_CLASSES: CharacterClass[] = [
  '攻撃式',
  '防御式',
  '速攻式',
  '支援式',
  '妨害式',
  '回復式',
  '破壊式',
  '技巧式',
];

function StatRow({
  label,
  value,
  bonus = 0,
  onChange,
}: {
  label: string;
  value: number;
  bonus?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-12 text-right text-sm text-gray-500 dark:text-gray-400 shrink-0">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-32 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
        />
        {bonus !== 0 && (
          <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap">
            +{bonus}{' '}
            <span className="text-[9px] font-normal opacity-80">(絵札)</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default function SelfStatsInput({
  stats,
  onChange,
  equippedStoryCards,
}: Props) {
  const set =
    <K extends keyof SelfStats>(field: K) =>
    (v: SelfStats[K]) =>
      onChange({ ...stats, [field]: v });

  const getSum = (key: keyof NonNullable<StoryCard['stats']>): number => {
    return equippedStoryCards.reduce(
      (acc, card) => acc + (card?.stats[key] ?? 0),
      0,
    );
  };

  return (
    <div className="space-y-6">
      {/* キャラクタースタイル */}
      <div className="flex items-center gap-3">
        <label className="w-12 text-right text-sm text-gray-500 dark:text-gray-400 shrink-0">
          式
        </label>
        <select
          value={stats.characterClass || ''}
          onChange={(e) =>
            set('characterClass')(e.target.value as CharacterClass)
          }
          className="w-32 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">未選択</option>
          {ALL_CLASSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* 基本ステータス */}
      <div className="space-y-2">
        <StatRow
          label="陽攻"
          value={stats.yangAttack}
          bonus={getSum('yangAttack')}
          onChange={set('yangAttack')}
        />
        <StatRow
          label="陰攻"
          value={stats.yinAttack}
          bonus={getSum('yinAttack')}
          onChange={set('yinAttack')}
        />
        <StatRow
          label="速力"
          value={stats.speed}
          bonus={getSum('speed')}
          onChange={set('speed')}
        />
        <StatRow
          label="陽防"
          value={stats.yangDefense}
          bonus={getSum('yangDefense')}
          onChange={set('yangDefense')}
        />
        <StatRow
          label="陰防"
          value={stats.yinDefense}
          bonus={getSum('yinDefense')}
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
