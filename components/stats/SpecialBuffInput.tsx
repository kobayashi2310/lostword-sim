'use client';

import type { ChargeEffect, DamageBonus } from '@/types';
import { calcTotalChargeMult } from '@/types';

interface Props {
  damageBonus: DamageBonus;
  onChange: (bonus: DamageBonus) => void;
}

type ChargeKind = '霊力' | '結界' | '体力';

const numCls =
  'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1.5 py-0.5 text-center focus:outline-none focus:border-blue-500';

/** 小数なし・0未満なし の整数変換 */
function toInt(v: number, min = 0): number {
  const n = Math.floor(Number.isFinite(v) ? v : 0);
  return Math.max(min, n);
}

function newCharge(kind: ChargeKind): ChargeEffect {
  if (kind === '体力') return { kind: '体力', maxRate: 0, hpPercent: 100 };
  return { kind, ratePerStack: 0, stacks: 1 };
}

/** 各エントリの蓄力倍率寄与（%表示用） */
function contribution(e: ChargeEffect): number {
  if (e.kind === '霊力' || e.kind === '結界') return e.ratePerStack * e.stacks;
  return Math.floor((e.maxRate * e.hpPercent) / 100);
}

export default function SpecialBuffInput({ damageBonus, onChange }: Props) {
  const { chargeEffects } = damageBonus;

  const setCharges = (effects: ChargeEffect[]) =>
    onChange({ ...damageBonus, chargeEffects: effects });

  const add = (kind: ChargeKind) =>
    setCharges([...chargeEffects, newCharge(kind)]);
  const remove = (i: number) =>
    setCharges(chargeEffects.filter((_, idx) => idx !== i));
  const update = (i: number, e: ChargeEffect) =>
    setCharges(chargeEffects.map((x, idx) => (idx === i ? e : x)));

  const totalMult = calcTotalChargeMult(chargeEffects);
  const totalPct = Math.round(totalMult * 100);

  return (
    <div className="space-y-3">
      {/* 蓄力エントリ一覧 */}
      {chargeEffects.map((effect, i) => (
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
                  update(i, {
                    ...effect,
                    ratePerStack: toInt(Number(e.target.value)),
                  })
                }
                className={`w-16 ${numCls}`}
                title="1霊力あたりの倍率%"
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
                  update(i, {
                    ...effect,
                    stacks: Math.min(5, toInt(Number(e.target.value))),
                  })
                }
                className={`w-12 ${numCls}`}
                title="霊力数（0〜5）"
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
                  update(i, {
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
                  update(i, {
                    ...effect,
                    hpPercent: Math.max(
                      1,
                      Math.min(100, toInt(Number(e.target.value), 1)),
                    ),
                  })
                }
                className={`w-14 ${numCls}`}
                title="現在の体力%（1〜100）"
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
            onClick={() => remove(i)}
            className="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-300 text-xs"
          >
            ✕
          </button>
        </div>
      ))}

      {/* 合計表示 */}
      {chargeEffects.length > 0 && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 dark:border-indigo-700">
          <span className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
            蓄力合計
          </span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300 font-mono ml-auto">
            +{totalPct}% → ×{(1 + totalMult).toFixed(2)}
          </span>
        </div>
      )}

      {/* 追加ボタン */}
      <div className="flex gap-1.5 flex-wrap">
        {(['霊力', '結界', '体力'] as ChargeKind[])
          .filter((k) => !chargeEffects.some((e) => e.kind === k))
          .map((k) => (
            <button
              key={k}
              onClick={() => add(k)}
              className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 border border-indigo-300 dark:border-indigo-600 rounded text-indigo-700 dark:text-indigo-300 transition-colors"
            >
              + 蓄力[{k}]
            </button>
          ))}
      </div>
    </div>
  );
}
