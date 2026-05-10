'use client';

import type { EnemyStats } from '@/types';
import BarrierAilmentsInput from './BarrierAilmentsInput';
import AbilityInput from './AbilityInput';

interface Props {
  stats: EnemyStats;
  onChange: (stats: EnemyStats) => void;
}

export default function EnemyStatsInput({ stats, onChange }: Props) {
  const set =
    <K extends keyof EnemyStats>(field: K) =>
    (v: EnemyStats[K]) =>
      onChange({ ...stats, [field]: v });

  return (
    <div className="space-y-4">
      {/* 防御ステータス */}
      <div className="space-y-2">
        {(['yangDefense', 'yinDefense'] as const).map((field) => (
          <div key={field} className="flex items-center gap-3">
            <label className="w-12 text-right text-sm text-gray-500 dark:text-gray-400 shrink-0">
              {field === 'yangDefense' ? '陽防' : '陰防'}
            </label>
            <input
              type="number"
              min={1}
              value={stats[field] as number}
              onChange={(e) => set(field)(Number(e.target.value))}
              className="w-32 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-6">
        {/* 結界の基本設定 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stats.hasBarriers}
                onChange={(e) => set('hasBarriers')(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                結界あり
              </span>
            </label>
          </div>

          {stats.hasBarriers && (
            <>
              <div className="flex items-center gap-3">
                <label className="w-12 text-right text-sm text-gray-500 dark:text-gray-400 shrink-0">
                  結界数
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={stats.initialBarriers}
                  onChange={(e) =>
                    set('initialBarriers')(Number(e.target.value))
                  }
                  className="w-20 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              <div className="flex items-center gap-3 ml-12">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!stats.isFullBreak}
                    onChange={(e) => set('isFullBreak')(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    最初からフルブレイク
                  </span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* 敵の結界異常（層ごと） */}
        {stats.hasBarriers && !stats.isFullBreak && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase mb-2 tracking-wider">
              敵の結界異常（層ごと）
            </h4>
            <BarrierAilmentsInput
              barriers={stats.barriers}
              maxBarriers={stats.initialBarriers}
              nullifyAilments={stats.ability.nullifyAilments}
              onChange={set('barriers')}
            />
          </div>
        )}

        {/* 敵の能力設定 */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <h4 className="text-[11px] font-semibold text-gray-400 uppercase mb-2 tracking-wider">
            敵の能力（バフ変換・無効化）
          </h4>
          <AbilityInput ability={stats.ability} onChange={set('ability')} />
        </div>
      </div>
    </div>
  );
}
