'use client';

import type { BarrierAilmentType, BarrierStatus } from '@/types';

const AILMENTS: BarrierAilmentType[] = ['燃焼', '凍結', '帯電', '毒霧', '暗闇'];

interface Props<T extends BarrierStatus[]> {
  barriers: T;
  maxBarriers: number;
  onChange: (barriers: T) => void;
  nullifyAilments?: BarrierAilmentType[];
}

export default function BarrierAilmentsInput<T extends BarrierStatus[]>({
  barriers,
  maxBarriers,
  onChange,
  nullifyAilments = [],
}: Props<T>) {
  const setAilment = (layerIdx: number, ailment: BarrierAilmentType | null) => {
    const next = [...barriers] as T;
    next[layerIdx] = { ...next[layerIdx], ailment };
    onChange(next);
  };

  const resetAll = () => {
    const next = barriers.map((b) => ({ ...b, ailment: null })) as T;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
          レイヤー別設定
        </span>
        <button
          onClick={resetAll}
          className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-700 transition-colors"
        >
          全解除
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {Array.from({ length: maxBarriers }).map((_, i) => {
          const currentAilment = barriers[i]?.ailment;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 w-3 font-mono">
                {i + 1}
              </span>
              <select
                value={currentAilment || ''}
                onChange={(e) =>
                  setAilment(i, (e.target.value as BarrierAilmentType) || null)
                }
                className={`flex-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer transition-colors ${
                  currentAilment
                    ? 'font-medium border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                    : ''
                }`}
              >
                <option value="">(なし)</option>
                {AILMENTS.map((a) => (
                  <option
                    key={a}
                    value={a}
                    disabled={nullifyAilments.includes(a)}
                  >
                    {a}
                    {nullifyAilments.includes(a) ? ' (無効)' : ''}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {nullifyAilments.length > 0 && (
        <p className="mt-2 text-[10px] text-gray-500 italic">
          ※能力により無効化されている異常は選択できません
        </p>
      )}
    </div>
  );
}
