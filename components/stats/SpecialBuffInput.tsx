'use client';

import type { ChargeEffect, DamageBonus, AccumulationEffect, AccumulationTarget } from '@/types';
import { calcTotalChargeMult } from '@/types';

interface Props {
  damageBonus: DamageBonus;
  onChange: (bonus: DamageBonus) => void;
}

type ChargeKind = '霊力' | '結界' | '体力';

const numCls =
  'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1.5 py-0.5 text-center focus:outline-none focus:border-blue-500';

const targetLabels: Record<AccumulationTarget, string> = {
  yangAttack: '陽攻',
  yinAttack: '陰攻',
  speed: '速力',
  yangDefense: '陽防',
  yinDefense: '陰防',
};

const ALL_TARGETS: AccumulationTarget[] = ['yangAttack', 'yinAttack', 'speed', 'yangDefense', 'yinDefense'];

/** 小数なし・0未満なし の整数変換 */
function toInt(v: number, min = 0): number {
  const n = Math.floor(Number.isFinite(v) ? v : 0);
  return Math.max(min, n);
}

function newCharge(kind: ChargeKind): ChargeEffect {
  if (kind === '体力') return { kind: '体力', maxRate: 0, hpPercent: 100 };
  return { kind, ratePerStack: 0, stacks: 1 };
}

function findUnusedAcc(existing: AccumulationEffect[]): AccumulationEffect | null {
  for (const src of ALL_TARGETS) {
    for (const tgt of ALL_TARGETS) {
      if (!existing.some(e => e.sourceStat === src && e.targetStat === tgt)) {
        return { sourceStat: src, targetStat: tgt, sourceValue: 1000, rate: 50 };
      }
    }
  }
  return null;
}

/** 各エントリの蓄力倍率寄与（%表示用） */
function contribution(e: ChargeEffect): number {
  if (e.kind === '霊力' || e.kind === '結界') return e.ratePerStack * e.stacks;
  return Math.floor((e.maxRate * e.hpPercent) / 100);
}

export default function SpecialBuffInput({ damageBonus, onChange }: Props) {
  const { chargeEffects, accumulationEffects = [] } = damageBonus;

  const setCharges = (effects: ChargeEffect[]) =>
    onChange({ ...damageBonus, chargeEffects: effects });

  const setAccs = (accs: AccumulationEffect[]) =>
    onChange({ ...damageBonus, accumulationEffects: accs });

  const addCharge = (kind: ChargeKind) =>
    setCharges([...chargeEffects, newCharge(kind)]);
  const removeCharge = (i: number) =>
    setCharges(chargeEffects.filter((_, idx) => idx !== i));
  const updateCharge = (i: number, e: ChargeEffect) =>
    setCharges(chargeEffects.map((x, idx) => (idx === i ? e : x)));

  const addAcc = () => {
    const fresh = findUnusedAcc(accumulationEffects);
    if (fresh) setAccs([...accumulationEffects, fresh]);
  };
  const removeAcc = (i: number) => setAccs(accumulationEffects.filter((_, idx) => idx !== i));
  const updateAcc = (i: number, a: AccumulationEffect) => 
    setAccs(accumulationEffects.map((x, idx) => (idx === i ? a : x)));

  const totalMult = calcTotalChargeMult(chargeEffects);
  const totalPct = Math.round(totalMult * 100);

  return (
    <div className="space-y-4">
      {/* 蓄力セクション */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">蓄力補正</h4>
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
        {chargeEffects.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 dark:border-indigo-700">
            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">蓄力合計</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300 font-mono ml-auto">
              +{totalPct}% → ×{(1 + totalMult).toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex gap-1.5 flex-wrap">
          {(['霊力', '結界', '体力'] as ChargeKind[])
            .filter((k) => !chargeEffects.some((e) => e.kind === k))
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

      <div className="border-t border-gray-100 dark:border-gray-800 my-4" />

      {/* 蓄積セクション */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">蓄積補正 (加算バフ)</h4>
        
        {accumulationEffects.map((acc, i) => {
          const result = Math.floor(((acc.sourceValue ?? 0) * (acc.rate ?? 0)) / 100);
          
          // この行で選択可能な targetStat を抽出 (他の行で使用中の sourceStat とのペアを除外)
          const availableTargets = ALL_TARGETS.filter(tgt => {
            if (tgt === acc.targetStat) return true; // 現在選んでいるものはOK
            return !accumulationEffects.some((other, idx) => 
              idx !== i && other.sourceStat === acc.sourceStat && other.targetStat === tgt
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
                  const isDup = accumulationEffects.some((other, idx) => 
                    idx !== i && other.sourceStat === newSrc && other.targetStat === acc.targetStat
                  );
                  if (isDup) {
                    const fallback = ALL_TARGETS.find(t => !accumulationEffects.some(o => o.sourceStat === newSrc && o.targetStat === t));
                    if (fallback) updateAcc(i, { ...acc, sourceStat: newSrc, targetStat: fallback });
                  } else {
                    updateAcc(i, { ...acc, sourceStat: newSrc });
                  }
                }}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-[10px] px-1 py-0.5"
                title="参照するステータス"
              >
                {ALL_TARGETS.map(val => (
                  <option key={val} value={val}>{targetLabels[val]}</option>
                ))}
              </select>
              <span className="text-[10px] text-gray-400">→</span>
              <select
                value={acc.targetStat}
                onChange={(e) => updateAcc(i, { ...acc, targetStat: e.target.value as AccumulationTarget })}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-[10px] px-1 py-0.5"
                title="加算先のステータス"
              >
                {availableTargets.map(val => (
                  <option key={val} value={val}>{targetLabels[val]}</option>
                ))}
              </select>

              <div className="flex items-center gap-1 ml-1">
                <span className="text-[10px] text-gray-500">倍率</span>
                <input
                  type="number"
                  value={acc.rate ?? 0}
                  onChange={(e) => updateAcc(i, { ...acc, rate: toInt(Number(e.target.value)) })}
                  className={`w-12 ${numCls}`}
                />
                <span className="text-[10px] text-gray-500">%</span>
              </div>

              <div className="flex items-center gap-1 ml-1">
                <span className="text-[10px] text-gray-500">元の数値</span>
                <input
                  type="number"
                  value={acc.sourceValue ?? 0}
                  onChange={(e) => updateAcc(i, { ...acc, sourceValue: toInt(Number(e.target.value)) })}
                  className={`w-16 ${numCls}`}
                />
              </div>

              <div className="flex items-center gap-1 ml-auto sm:ml-2 bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                <span className="text-[10px] text-gray-400">＝</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">+{result}</span>
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
    </div>
  );
}
