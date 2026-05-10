'use client';

import type { ResonanceEffect, ResonanceKind } from '@/types';

interface Props {
  effects: ResonanceEffect[];
  onChange: (effects: ResonanceEffect[]) => void;
}

const numCls =
  'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1.5 py-0.5 text-center focus:outline-none focus:border-blue-500';

function toInt(v: number, min = 0): number {
  const n = Math.floor(Number.isFinite(v) ? v : 0);
  return Math.max(min, n);
}

function newResonance(kind: ResonanceKind): ResonanceEffect {
  return { kind, value: 0 };
}

export default function ResonanceBuffSection({ effects, onChange }: Props) {
  const addResonance = (kind: ResonanceKind) =>
    onChange([...effects, newResonance(kind)]);
  const removeResonance = (i: number) =>
    onChange(effects.filter((_, idx) => idx !== i));
  const updateResonance = (i: number, e: ResonanceEffect) =>
    onChange(effects.map((x, idx) => (idx === i ? e : x)));

  const getResonanceSum = (kind: ResonanceKind) =>
    effects.filter((e) => e.kind === kind).reduce((sum, e) => sum + e.value, 0);

  const resSums = {
    ダメージアップ: getResonanceSum('ダメージアップ'),
    CRI時ダメージアップ: getResonanceSum('CRI時ダメージアップ'),
    攻撃時CRI率: getResonanceSum('攻撃時CRI率'),
    速力: getResonanceSum('速力'),
  };

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        共鳴補正 (別枠乗算)
      </h4>
      {effects.map((effect, i) => (
        <div
          key={i}
          className="flex items-center gap-2 flex-wrap bg-gray-100 dark:bg-gray-800 rounded px-2 py-2"
        >
          <span className="text-xs text-purple-600 dark:text-purple-300 font-semibold shrink-0 w-32">
            共鳴[{effect.kind}]
          </span>
          <input
            type="number"
            min={0}
            step={1}
            value={effect.value}
            onChange={(e) =>
              updateResonance(i, {
                ...effect,
                value: toInt(Number(e.target.value)),
              })
            }
            className={`w-16 ${numCls}`}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">%</span>
          <button
            onClick={() => removeResonance(i)}
            className="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-300 text-xs"
          >
            ✕
          </button>
        </div>
      ))}
      {effects.length > 0 && (
        <div className="space-y-1.5">
          {resSums.ダメージアップ > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-100 dark:border-purple-700">
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                ダメージアップ合計
              </span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-300 font-mono ml-auto">
                +{resSums.ダメージアップ}% → ×
                {(1 + resSums.ダメージアップ / 100).toFixed(2)}
              </span>
            </div>
          )}
          {resSums.CRI時ダメージアップ > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-100 dark:border-purple-700">
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                CRIダメUP合計
              </span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-300 font-mono ml-auto">
                +{resSums.CRI時ダメージアップ}% → ×
                {(1 + resSums.CRI時ダメージアップ / 100).toFixed(2)}
              </span>
            </div>
          )}
          {resSums.攻撃時CRI率 > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-100 dark:border-purple-700">
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                CRI率加算合計
              </span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-300 font-mono ml-auto">
                基礎値に +{resSums.攻撃時CRI率}%
              </span>
            </div>
          )}
          {resSums.速力 > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-100 dark:border-purple-700">
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                速力合計
              </span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-300 font-mono ml-auto">
                ×{(1 + resSums.速力 / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-1.5 flex-wrap">
        {(
          [
            'ダメージアップ',
            'CRI時ダメージアップ',
            '攻撃時CRI率',
            '速力',
          ] as ResonanceKind[]
        )
          .filter((k) => !effects.some((e) => e.kind === k))
          .map((k) => (
            <button
              key={k}
              onClick={() => addResonance(k)}
              className="text-xs px-2 py-1 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors"
            >
              + 共鳴[{k}]
            </button>
          ))}
      </div>
    </div>
  );
}
