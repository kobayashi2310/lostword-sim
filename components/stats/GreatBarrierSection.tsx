'use client';

import type {
  GreatBarrierConfig,
  GreatBarrierDir,
  GreatBarrierEntry,
  GreatBarrierStatType,
} from '@/types';
import { createDefaultGreatBarrierConfig } from '@/types';

interface Props {
  greatBarrier: GreatBarrierConfig | null | undefined;
  onChange: (gb: GreatBarrierConfig | null) => void;
}

const STAT_OPTIONS: GreatBarrierStatType[] = [
  '陽攻',
  '陰攻',
  '速力',
  '陽防',
  '陰防',
  'CRI攻撃/CRI防御',
  '威力',
];

function oppDir(dir: GreatBarrierDir): GreatBarrierDir {
  return dir === 'UP' ? 'DOWN' : 'UP';
}

const numCls =
  'w-16 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1.5 py-0.5 text-center focus:outline-none focus:border-blue-500';

function DirBadge({
  dir,
  interactive,
  onClick,
}: {
  dir: GreatBarrierDir;
  interactive?: boolean;
  onClick?: () => void;
}) {
  const cls =
    dir === 'UP'
      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-600 dark:text-blue-300'
      : 'bg-red-50 dark:bg-red-900/30 border-red-400 text-red-600 dark:text-red-300';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold transition-colors ${cls} ${
        interactive ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
      }`}
    >
      {dir === 'UP' ? '▲UP' : '▼DOWN'}
    </button>
  );
}

export default function GreatBarrierSection({ greatBarrier, onChange }: Props) {
  const enabled = greatBarrier != null;
  const gb = greatBarrier ?? createDefaultGreatBarrierConfig();

  const toggle = () =>
    onChange(enabled ? null : createDefaultGreatBarrierConfig());

  // 有効化時に空なら1行を自動補完
  const defaultEntry: GreatBarrierEntry = {
    id: 0,
    stat: '陽攻',
    selfDir: 'UP',
    selfValue: 0,
    enemyValue: 0,
  };
  const entries = gb.entries.length > 0 ? gb.entries : [defaultEntry];

  const updateEntry = (id: number, patch: Partial<GreatBarrierEntry>) => {
    onChange({
      entries: entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

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
          {entries.map((entry) => (
            <div key={entry.id} className="space-y-1">
              {/* 1行目: 項目選択 */}
              <select
                value={entry.stat}
                onChange={(e) =>
                  updateEntry(entry.id, {
                    stat: e.target.value as GreatBarrierStatType,
                  })
                }
                className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {STAT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* 2行目: 味方 / 相手 を2列グリッド */}
              <div className="grid grid-cols-2 gap-x-2">
                {/* 味方 */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0">
                    味方
                  </span>
                  <input
                    type="number"
                    step={1}
                    min={0}
                    value={entry.selfValue}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      const v = Number.isFinite(n) && n >= 0 ? n : 0;
                      updateEntry(entry.id, { selfValue: v, enemyValue: v });
                    }}
                    className={numCls}
                  />
                  <span className="text-[10px] text-gray-400 shrink-0">%</span>
                  <DirBadge
                    dir={entry.selfDir}
                    interactive
                    onClick={() =>
                      updateEntry(entry.id, { selfDir: oppDir(entry.selfDir) })
                    }
                  />
                </div>

                {/* 相手（値は味方と同期・方向は常に逆） */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0">
                    相手
                  </span>
                  <input
                    type="number"
                    step={1}
                    min={0}
                    value={entry.enemyValue}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      const v = Number.isFinite(n) && n >= 0 ? n : 0;
                      updateEntry(entry.id, { selfValue: v, enemyValue: v });
                    }}
                    className={numCls}
                  />
                  <span className="text-[10px] text-gray-400 shrink-0">%</span>
                  <DirBadge
                    dir={oppDir(entry.selfDir)}
                    interactive
                    onClick={() =>
                      updateEntry(entry.id, { selfDir: oppDir(entry.selfDir) })
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {entries.length > 0 && (
            <div className="px-2 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-100 dark:border-amber-800 text-[10px] text-amber-700 dark:text-amber-300">
              大結界は別枠乗算・同時に1つのみ有効
            </div>
          )}
        </div>
      )}
    </div>
  );
}
