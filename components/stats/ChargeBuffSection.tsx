'use client';

import type { ChargeEffect } from '@/types';

type ChargeKind = '霊力' | '結界' | '体力';

interface Props {
  effects: ChargeEffect[];
  onChange: (effects: ChargeEffect[]) => void;
}

const numCls =
  'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1.5 py-0.5 text-center focus:outline-none focus:border-blue-500';

function toInt(v: number, min = 0): number {
  const n = Math.floor(Number.isFinite(v) ? v : 0);
  return Math.max(min, n);
}

function newCharge(kind: ChargeKind): ChargeEffect {
  if (kind === '体力') return { kind: '体力', maxRate: 0, hpPercent: 100 };
  return { kind, ratePerStack: 0, stacks: 1 };
}

function contribution(e: ChargeEffect): number {
  if (e.kind === '霊力' || e.kind === '結界') return e.ratePerStack * e.stacks;
  return Math.floor((e.maxRate * e.hpPercent) / 100);
}

export default function ChargeBuffSection({ effects, onChange }: Props) {
  const addCharge = (kind: ChargeKind) => onChange([...effects, newCharge(kind)]);
  const removeCharge = (i: number) => onChange(effects.filter((_, idx) => idx !== i));
  const updateCharge = (i: number, e: ChargeEffect) =>
    onChange(effects.map((x, idx) => (idx === i ? e : x)));

  const totalMult = effects.reduce((sum, e) => {
    if (e.kind === '霊力' || e.kind === '結界') {
      return sum + (e.ratePerStack / 100) * e.stacks;
    }
    return sum + (e.maxRate / 100) * (e.hpPercent / 100);
  }, 0);
  const totalPct = Math.round(totalMult * 100);

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        蓄力補正
      </h4>
      {effects.map((effect, i) => (
        <div
          key={i}
          className="flex items-center gap-2 flex-wrap bg-gray-100 dark:bg-gray-800 rounded px-2 py-2"
        >
          <span className="text-xs text-indigo-600 dark:text-indigo-300 font-semibold shrink-0 w-20">
            蓄力[{effect.kind}]
          </span>

          {(effect.kind === '霊力' || effect.kind === '結界') && (
            <>
              <input
                type="number"
                min={0}
                step={1}
                value={effect.ratePerStack}
                onChange={(e) =>
                  updateCharge(i, {
                    ...effect,
                    ratePerStack: toInt(Number(e.target.value)),
                  })
                }
                className={`w-16 ${numCls}`}
                title="1スタックあたりの倍率%"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                % ×
              </span>
              <input
                type="number"
                min={0}
                max={5}
                step={1}
                value={effect.stacks}
                onChange={(e) =>
                  updateCharge(i, {
                    ...effect,
                    stacks: Math.min(5, toInt(Number(e.target.value))),
                  })
                }
                className={`w-12 ${numCls}`}
                title="スタック数"
              />
              <span className="text-xs text-indigo-500 dark:text-indigo-400 ml-1">
                = +{contribution(effect)}%
              </span>
            </>
          )}

          {effect.kind === '体力' && (
            <>
              <input
                type="number"
                min={0}
                step={1}
                value={effect.maxRate}
                onChange={(e) =>
                  updateCharge(i, {
                    ...effect,
                    maxRate: toInt(Number(e.target.value)),
                  })
                }
                className={`w-16 ${numCls}`}
                title="HP100%時の最大倍率%"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                % × HP
              </span>
              <input
                type="number"
                min={1}
                max={100}
                step={1}
                value={effect.hpPercent}
                onChange={(e) =>
                  updateCharge(i, {
                    ...effect,
                    hpPercent: Math.max(
                      1,
                      Math.min(100, toInt(Number(e.target.value), 1)),
                    ),
                  })
                }
                className={`w-14 ${numCls}`}
                title="現在の体力%"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                %
              </span>
              <span className="text-xs text-indigo-500 dark:text-indigo-400 ml-1">
                = +{contribution(effect)}%
              </span>
            </>
          )}

          <button
            onClick={() => removeCharge(i)}
            className="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-300 text-xs"
          >
            ✕
          </button>
        </div>
      ))}
      {effects.length > 0 && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 dark:border-indigo-700">
          <span className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
            蓄力合計
          </span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300 font-mono ml-auto">
            +{totalPct}% → ×{(1 + totalMult).toFixed(2)}
          </span>
        </div>
      )}
      <div className="flex gap-1.5 flex-wrap">
        {(['霊力', '結界', '体力'] as ChargeKind[])
          .filter((k) => !effects.some((e) => e.kind === k))
          .map((k) => (
            <button
              key={k}
              onClick={() => addCharge(k)}
              className="text-xs px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
            >
              + 蓄力[{k}]
            </button>
          ))}
      </div>
    </div>
  );
}
