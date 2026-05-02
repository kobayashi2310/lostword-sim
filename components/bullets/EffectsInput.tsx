'use client';

import type {
  BulletEffect,
  EnemyDebuffEffectType,
  SelfBuffEffectType,
} from '@/types';
import { ENEMY_DEBUFF_EFFECT_TYPES, SELF_BUFF_EFFECT_TYPES } from '@/types';

interface Props {
  effects: BulletEffect[];
  onChange: (effects: BulletEffect[]) => void;
}

type EffectKind = '必中' | '特効' | '自身バフ' | '対象デバフ';

const selectCls =
  'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1 py-0.5';
const numCls =
  'w-14 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1 py-0.5 text-center';

function newEffect(kind: EffectKind): BulletEffect {
  switch (kind) {
    case '必中':
      return { kind: '必中' };
    case '特効':
      return { kind: '特効' };
    case '自身バフ':
      return {
        kind: '自身バフ',
        buffType: '自身陽攻上昇',
        probability: 100,
        stages: 1,
      };
    case '対象デバフ':
      return {
        kind: '対象デバフ',
        debuffType: '対象CRI防御低下',
        probability: 100,
        stages: 1,
      };
  }
}

export default function EffectsInput({ effects, onChange }: Props) {
  const add = (kind: EffectKind) => onChange([...effects, newEffect(kind)]);
  const remove = (i: number) => onChange(effects.filter((_, idx) => idx !== i));
  const update = (i: number, e: BulletEffect) =>
    onChange(effects.map((x, idx) => (idx === i ? e : x)));

  return (
    <div className="space-y-1.5">
      {effects.map((effect, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 flex-wrap bg-gray-100 dark:bg-gray-800 rounded px-2 py-1.5"
        >
          <span className="text-xs text-blue-600 dark:text-blue-300 w-16 shrink-0">
            {effect.kind}
          </span>

          {effect.kind === '自身バフ' && (
            <>
              <select
                value={effect.buffType}
                onChange={(e) =>
                  update(i, {
                    ...effect,
                    buffType: e.target.value as SelfBuffEffectType,
                  })
                }
                className={selectCls}
              >
                {SELF_BUFF_EFFECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={10}
                value={effect.stages}
                title="段階"
                onChange={(e) =>
                  update(i, { ...effect, stages: Number(e.target.value) })
                }
                className={numCls}
              />
              <span className="text-xs text-gray-500">段</span>
              <input
                type="number"
                min={0}
                max={100}
                value={effect.probability}
                title="確率%"
                onChange={(e) =>
                  update(i, { ...effect, probability: Number(e.target.value) })
                }
                className={numCls}
              />
              <span className="text-xs text-gray-500">%</span>
            </>
          )}

          {effect.kind === '対象デバフ' && (
            <>
              <select
                value={effect.debuffType}
                onChange={(e) =>
                  update(i, {
                    ...effect,
                    debuffType: e.target.value as EnemyDebuffEffectType,
                  })
                }
                className={selectCls}
              >
                {ENEMY_DEBUFF_EFFECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={10}
                value={effect.stages}
                title="段階"
                onChange={(e) =>
                  update(i, { ...effect, stages: Number(e.target.value) })
                }
                className={numCls}
              />
              <span className="text-xs text-gray-500">段</span>
              <input
                type="number"
                min={0}
                max={100}
                value={effect.probability}
                title="確率%"
                onChange={(e) =>
                  update(i, { ...effect, probability: Number(e.target.value) })
                }
                className={numCls}
              />
              <span className="text-xs text-gray-500">%</span>
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

      <div className="flex gap-1 flex-wrap">
        {(['必中', '特効', '自身バフ', '対象デバフ'] as EffectKind[]).map(
          (k) => (
            <button
              key={k}
              onClick={() => add(k)}
              className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors"
            >
              + {k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
