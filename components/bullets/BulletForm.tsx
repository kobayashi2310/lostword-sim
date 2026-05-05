'use client';

import { useState } from 'react';
import type { Bullet } from '@/types';
import { ALL_BULLET_KINDS, ALL_ELEMENTS } from '@/types';
import EffectsInput from './EffectsInput';

interface Props {
  bullet: Bullet;
  onChange: (bullet: Bullet) => void;
}

const ELEMENT_COLORS: Record<string, string> = {
  星: 'text-yellow-500 dark:text-yellow-300',
  火: 'text-red-500 dark:text-red-400',
  水: 'text-blue-500 dark:text-blue-400',
  木: 'text-green-600 dark:text-green-400',
  金: 'text-yellow-600 dark:text-yellow-500',
  土: 'text-amber-600 dark:text-amber-500',
  日: 'text-orange-500 dark:text-orange-300',
  月: 'text-purple-500 dark:text-purple-400',
};

const selectCls =
  'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1 py-0.5 focus:outline-none';

const numInputCls =
  'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1.5 py-0.5 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400';

export default function BulletForm({ bullet, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  const set =
    <K extends keyof Bullet>(field: K) =>
    (value: Bullet[K]) =>
      onChange({ ...bullet, [field]: value });

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* ヘッダー行（折りたたみ） */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-gray-400 text-xs w-4 shrink-0">{bullet.id}</span>
        <span
          className={`text-sm font-semibold shrink-0 ${ELEMENT_COLORS[bullet.element] ?? ''}`}
        >
          {bullet.element}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
          {bullet.yinYang}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-500 shrink-0">
          {bullet.bulletKind}
        </span>
        <span className="text-sm text-gray-800 dark:text-white font-mono ml-1">
          {bullet.power} × {bullet.count}発
        </span>
        {bullet.slashPercent > 0 && (
          <span className="text-xs text-cyan-600 dark:text-cyan-400">
            斬裂{bullet.slashPercent}%
          </span>
        )}
        {bullet.hardPercent > 0 && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            硬質{bullet.hardPercent}%
          </span>
        )}
        {bullet.isPenetration && (
          <span className="text-xs text-purple-600 dark:text-purple-400">
            貫通
          </span>
        )}
        {bullet.effects.some((e) => e.kind === '必中') && (
          <span className="text-xs text-green-600 dark:text-green-400">
            必中
          </span>
        )}
        {bullet.effects.some((e) => e.kind === '特効') && (
          <span className="text-xs text-red-500 dark:text-red-300">特効</span>
        )}
        <span className="ml-auto text-gray-400 text-xs">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* 展開詳細 */}
      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3 bg-gray-50 dark:bg-gray-800/80">
          {/* 属性・陰陽・弾種 */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                属性
              </span>
              <select
                value={bullet.element}
                onChange={(e) =>
                  set('element')(e.target.value as Bullet['element'])
                }
                className={selectCls}
              >
                {ALL_ELEMENTS.map((el) => (
                  <option key={el} value={el}>
                    {el}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                陰陽
              </span>
              <select
                value={bullet.yinYang}
                onChange={(e) =>
                  set('yinYang')(e.target.value as Bullet['yinYang'])
                }
                className={selectCls}
              >
                <option value="陽気">陽気</option>
                <option value="陰気">陰気</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                弾種
              </span>
              <select
                value={bullet.bulletKind}
                onChange={(e) =>
                  set('bulletKind')(e.target.value as Bullet['bulletKind'])
                }
                className={selectCls}
              >
                {ALL_BULLET_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 威力・弾数 */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                威力
              </span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={bullet.power}
                onChange={(e) => set('power')(Number(e.target.value))}
                className={`w-20 ${numInputCls}`}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                弾数
              </span>
              <input
                type="number"
                min={1}
                value={bullet.count}
                onChange={(e) => set('count')(Number(e.target.value))}
                className={`w-16 ${numInputCls}`}
              />
            </div>
          </div>

          {/* 命中率・CRI命中率・貫通 */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                命中率
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={bullet.hitRate}
                onChange={(e) => set('hitRate')(Number(e.target.value))}
                className={`w-16 ${numInputCls}`}
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                CRI命中
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={bullet.criRate}
                onChange={(e) => set('criRate')(Number(e.target.value))}
                className={`w-16 ${numInputCls}`}
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <div className="flex items-center gap-3 ml-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bullet.isPenetration}
                  onChange={(e) => set('isPenetration')(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  貫通弾
                </span>
              </label>
            </div>
          </div>

          {/* 斬裂・硬質（独立フィールド・同時指定可） */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-cyan-600 dark:text-cyan-400">
                斬裂%
              </span>
              <input
                type="number"
                min={0}
                max={1000}
                value={bullet.slashPercent}
                onChange={(e) => set('slashPercent')(Number(e.target.value))}
                className={`w-20 ${numInputCls}`}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-amber-600 dark:text-amber-400">
                硬質%
              </span>
              <input
                type="number"
                min={0}
                max={1000}
                value={bullet.hardPercent}
                onChange={(e) => set('hardPercent')(Number(e.target.value))}
                className={`w-20 ${numInputCls}`}
              />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              （0=なし、同時指定可）
            </span>
          </div>

          {/* 追加効果 */}
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5">
              追加効果
            </span>
            <EffectsInput effects={bullet.effects} onChange={set('effects')} />
          </div>
        </div>
      )}
    </div>
  );
}
