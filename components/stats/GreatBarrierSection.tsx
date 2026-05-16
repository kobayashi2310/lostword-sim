'use client';

import type { GreatBarrierConfig } from '@/types';
import { createDefaultGreatBarrierConfig } from '@/types';

interface Props {
  greatBarrier: GreatBarrierConfig | null | undefined;
  onChange: (gb: GreatBarrierConfig | null) => void;
}

const numCls =
  'w-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1.5 py-0.5 text-center focus:outline-none focus:border-blue-500';

type FieldKey = keyof GreatBarrierConfig;

const FIELDS: { label: string; key: FieldKey; note: string }[] = [
  { label: '自身陽攻', key: 'selfYangAttack', note: '自身 別枠乗算' },
  { label: '自身陰攻', key: 'selfYinAttack', note: '自身 別枠乗算' },
  { label: '自身速力', key: 'selfSpeed', note: '自身 別枠乗算' },
  { label: '自身陽防', key: 'selfYangDef', note: '自身 別枠乗算' },
  { label: '自身陰防', key: 'selfYinDef', note: '自身 別枠乗算' },
  { label: '敵陽防', key: 'enemyYangDef', note: '敵 FB中も有効' },
  { label: '敵陰防', key: 'enemyYinDef', note: '敵 FB中も有効' },
  { label: 'CRI攻撃', key: 'criAttack', note: 'CRI時ダメ乗算' },
  { label: '敵CRI防御', key: 'enemyCriDef', note: 'CRI時ダメ (負=アップ)' },
  { label: '威力', key: 'powerBonus', note: '威力 乗算' },
];

function toMult(pct: number, key: FieldKey): string {
  // 敵CRI防御は「負のとき=ダメアップ」なので multiplier = (1 - pct/100)
  const mult = key === 'enemyCriDef' ? 1 - pct / 100 : 1 + pct / 100;
  return `×${mult.toFixed(2)}`;
}

export default function GreatBarrierSection({ greatBarrier, onChange }: Props) {
  const enabled = greatBarrier != null;
  const gb = greatBarrier ?? createDefaultGreatBarrierConfig();

  const toggle = () => onChange(enabled ? null : createDefaultGreatBarrierConfig());

  const update = (key: FieldKey, value: number) => {
    onChange({ ...gb, [key]: value });
  };

  const hasAnyEffect = enabled && FIELDS.some((f) => gb[f.key] !== 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          大結界
        </h4>
        <button
          onClick={toggle}
          className={`text-xs px-2 py-0.5 rounded border transition-colors ${
            enabled
              ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-700 dark:text-amber-300'
              : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-amber-400'
          }`}
        >
          {enabled ? '有効' : '無効'}
        </button>
      </div>

      {enabled && (
        <div className="space-y-1.5 pl-1">
          {FIELDS.map(({ label, key, note }) => {
            const val = gb[key];
            const isActive = val !== 0;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-300 w-20 shrink-0">
                  {label}
                </span>
                <input
                  type="number"
                  step={1}
                  value={val}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    update(key, Number.isFinite(n) ? n : 0);
                  }}
                  className={numCls}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">%</span>
                {isActive && (
                  <span className="text-xs font-mono text-amber-600 dark:text-amber-400">
                    {toMult(val, key)}
                  </span>
                )}
                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
                  {note}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {hasAnyEffect && (
        <div className="px-2 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-100 dark:border-amber-800 text-[10px] text-amber-700 dark:text-amber-300">
          大結界は別枠乗算・同時に1つのみ有効
        </div>
      )}
    </div>
  );
}
