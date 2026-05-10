'use client';

import type {
  BulletEffect,
  EnemyDebuffEffectType,
  SelfBuffEffectType,
  BarrierAilmentType,
  BreakEffectType,
  AilmentTarget,
} from '@/types';
import { ENEMY_DEBUFF_EFFECT_TYPES, SELF_BUFF_EFFECT_TYPES } from '@/types';

interface Props {
  effects: BulletEffect[];
  onChange: (effects: BulletEffect[]) => void;
}

type EffectKind =
  | '必中'
  | '特効'
  | 'ブレイク'
  | '異常付与'
  | '弾性弾'
  | '爆破弾'
  | '精密弾'
  | '自身バフ'
  | '対象デバフ';

const selectCls =
  'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1 py-0.5';
const numCls =
  'w-14 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1 py-0.5 text-center';

const AILMENTS: BarrierAilmentType[] = ['燃焼', '凍結', '帯電', '毒霧', '暗闇'];
const BREAK_TYPES: BreakEffectType[] = ['過毒', '焼却', '氷解', '放電', '閃光'];

function newEffect(kind: EffectKind): BulletEffect {
  switch (kind) {
    case '必中':
      return { kind: '必中' };
    case '特効':
      return { kind: '特効' };
    case 'ブレイク':
      return { kind: 'ブレイク', breakType: '過毒' };
    case '異常付与':
      return {
        kind: '異常付与',
        ailmentType: '燃焼',
        target: 'enemy',
        probability: 100,
      };
    case '弾性弾':
      return { kind: '弾性弾' };
    case '爆破弾':
      return { kind: '爆破弾' };
    case '精密弾':
      return { kind: '精密弾' };
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
        debuffType: '対象陽防低下',
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
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300 w-14 shrink-0">
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

          {effect.kind === '異常付与' && (
            <>
              <select
                value={effect.ailmentType}
                onChange={(e) =>
                  update(i, {
                    ...effect,
                    ailmentType: e.target.value as BarrierAilmentType,
                  })
                }
                className={selectCls}
              >
                {AILMENTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={effect.target}
                onChange={(e) =>
                  update(i, {
                    ...effect,
                    target: e.target.value as AilmentTarget,
                  })
                }
                className={selectCls}
              >
                <option value="enemy">相手へ</option>
                <option value="self">自分へ</option>
              </select>
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

          {effect.kind === 'ブレイク' && (
            <>
              <select
                value={effect.breakType}
                onChange={(e) =>
                  update(i, {
                    ...effect,
                    breakType: e.target.value as BreakEffectType,
                  })
                }
                className={selectCls}
              >
                {BREAK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
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
        {(
          [
            '必中',
            '特効',
            '弾性弾',
            '爆破弾',
            '精密弾',
            'ブレイク',
            '異常付与',
            '自身バフ',
            '対象デバフ',
          ] as EffectKind[]
        ).map((k) => (
          <button
            key={k}
            onClick={() => add(k)}
            className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors"
          >
            + {k}
          </button>
        ))}
      </div>
    </div>
  );
}
