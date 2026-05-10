'use client';

import type { AccumulationEffect, AccumulationTarget } from '@/types';

interface Props {
  effects: AccumulationEffect[];
  onChange: (effects: AccumulationEffect[]) => void;
}

const numCls =
  'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1.5 py-0.5 text-center focus:outline-none focus:border-blue-500';

const targetLabels: Record<AccumulationTarget, string> = {
  yangAttack: '陽攻',
  yinAttack: '陰攻',
  speed: '速力',
  yangDefense: '陽防',
  yinDefense: '陰防',
};

const ALL_TARGETS: AccumulationTarget[] = [
  'yangAttack',
  'yinAttack',
  'speed',
  'yangDefense',
  'yinDefense',
];

function toInt(v: number, min = 0): number {
  const n = Math.floor(Number.isFinite(v) ? v : 0);
  return Math.max(min, n);
}

function findUnusedAcc(
  existing: AccumulationEffect[],
): AccumulationEffect | null {
  for (const src of ALL_TARGETS) {
    for (const tgt of ALL_TARGETS) {
      if (!existing.some((e) => e.sourceStat === src && e.targetStat === tgt)) {
        return {
          sourceStat: src,
          targetStat: tgt,
          sourceValue: 1000,
          rate: 50,
        };
      }
    }
  }
  return null;
}

export default function AccumulationBuffSection({ effects, onChange }: Props) {
  const addAcc = () => {
    const fresh = findUnusedAcc(effects);
    if (fresh) onChange([...effects, fresh]);
  };
  const removeAcc = (i: number) =>
    onChange(effects.filter((_, idx) => idx !== i));
  const updateAcc = (i: number, a: AccumulationEffect) =>
    onChange(effects.map((x, idx) => (idx === i ? a : x)));

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        蓄積補正 (加算バフ)
      </h4>

      {effects.map((acc, i) => {
        const result = Math.floor(
          ((acc.sourceValue ?? 0) * (acc.rate ?? 0)) / 100,
        );

        const availableTargets = ALL_TARGETS.filter((tgt) => {
          if (tgt === acc.targetStat) return true;
          return !effects.some(
            (other, idx) =>
              idx !== i &&
              other.sourceStat === acc.sourceStat &&
              other.targetStat === tgt,
          );
        });

        return (
          <div
            key={i}
            className="flex items-center gap-1.5 flex-wrap bg-gray-100 dark:bg-gray-800 rounded px-2 py-2"
          >
            <select
              value={acc.sourceStat}
              onChange={(e) => {
                const newSrc = e.target.value as AccumulationTarget;
                const isDup = effects.some(
                  (other, idx) =>
                    idx !== i &&
                    other.sourceStat === newSrc &&
                    other.targetStat === acc.targetStat,
                );
                if (isDup) {
                  const fallback = ALL_TARGETS.find(
                    (t) =>
                      !effects.some(
                        (o) => o.sourceStat === newSrc && o.targetStat === t,
                      ),
                  );
                  if (fallback)
                    updateAcc(i, {
                      ...acc,
                      sourceStat: newSrc,
                      targetStat: fallback,
                    });
                } else {
                  updateAcc(i, { ...acc, sourceStat: newSrc });
                }
              }}
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-[10px] px-1 py-0.5"
              title="参照するステータス"
            >
              {ALL_TARGETS.map((val) => (
                <option key={val} value={val}>
                  {targetLabels[val]}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-gray-400">→</span>
            <select
              value={acc.targetStat}
              onChange={(e) =>
                updateAcc(i, {
                  ...acc,
                  targetStat: e.target.value as AccumulationTarget,
                })
              }
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-[10px] px-1 py-0.5"
              title="加算先のステータス"
            >
              {availableTargets.map((val) => (
                <option key={val} value={val}>
                  {targetLabels[val]}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 ml-1">
              <span className="text-[10px] text-gray-500">倍率</span>
              <input
                type="number"
                value={acc.rate ?? 0}
                onChange={(e) =>
                  updateAcc(i, {
                    ...acc,
                    rate: toInt(Number(e.target.value)),
                  })
                }
                className={`w-12 ${numCls}`}
              />
              <span className="text-[10px] text-gray-500">%</span>
            </div>

            <div className="flex items-center gap-1 ml-1">
              <span className="text-[10px] text-gray-500">元の数値</span>
              <input
                type="number"
                value={acc.sourceValue ?? 0}
                onChange={(e) =>
                  updateAcc(i, {
                    ...acc,
                    sourceValue: toInt(Number(e.target.value)),
                  })
                }
                className={`w-16 ${numCls}`}
              />
            </div>

            <div className="flex items-center gap-1 ml-auto sm:ml-2 bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
              <span className="text-[10px] text-gray-400">＝</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                +{result}
              </span>
            </div>

            <button
              onClick={() => removeAcc(i)}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-300 text-xs px-1"
            >
              ✕
            </button>
          </div>
        );
      })}

      <button
        onClick={addAcc}
        className="text-[10px] px-2 py-1 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
      >
        + 蓄積バフを追加
      </button>
    </div>
  );
}
