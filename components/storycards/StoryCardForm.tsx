'use client';

import React, { useState } from 'react';
import type {
  StoryCard,
  StoryCardEffect,
  StoryCardEffectKind,
  CharacterClass,
} from '@/types';

const ALL_KINDS: StoryCardEffectKind[] = [
  '自身バフ',
  '対象デバフ',
  '属性ダメージUP',
  '弾種ダメージUP',
  '霊力上昇',
  '結界増加',
  'ダメージ軽減',
];

const ALL_CLASSES: CharacterClass[] = [
  '攻撃式', '防御式', '速攻式', '支援式', '妨害式', '回復式', '破壊式', '技巧式',
];

const TARGET_OPTIONS: Partial<Record<StoryCardEffectKind, string[]>> = {
  自身バフ: ['陽攻', '陰攻', '速力', '陽防', '陰防', '命中', 'CRI攻撃', 'CRI命中'],
  対象デバフ: ['陽防', '陰防', 'CRI防御', 'CRI回避'],
  属性ダメージUP: ['無', '火', '水', '木', '金', '土', '日', '月', '星', '天'],
  弾種ダメージUP: ['通常弾', 'レーザー弾', '肉弾', '符弾', '斬撃弾', '貫通弾'],
};

const NO_TARGET_KINDS: StoryCardEffectKind[] = ['霊力上昇', '結界増加', 'ダメージ軽減'];

const inputCls =
  'w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 dark:focus:border-blue-400';
const selectCls =
  'px-1.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 dark:focus:border-blue-400';

function emptyEffect(): StoryCardEffect {
  return { kind: '自身バフ', target: '陽攻', value: 1 };
}

interface Props {
  initial?: StoryCard;
  onSave: (card: StoryCard) => void;
  onCancel: () => void;
}

export default function StoryCardForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [stats, setStats] = useState({
    yangAttack: initial?.stats.yangAttack ?? 0,
    yinAttack: initial?.stats.yinAttack ?? 0,
    speed: initial?.stats.speed ?? 0,
    yangDefense: initial?.stats.yangDefense ?? 0,
    yinDefense: initial?.stats.yinDefense ?? 0,
  });
  const [effects, setEffects] = useState<StoryCardEffect[]>(
    initial?.effects ?? [],
  );

  const setStat = (key: keyof typeof stats) => (v: number) =>
    setStats((prev) => ({ ...prev, [key]: v }));

  const addEffect = () => setEffects((prev) => [...prev, emptyEffect()]);

  const removeEffect = (i: number) =>
    setEffects((prev) => prev.filter((_, idx) => idx !== i));

  const updateEffect = (i: number, patch: Partial<StoryCardEffect>) =>
    setEffects((prev) =>
      prev.map((eff, idx) => {
        if (idx !== i) return eff;
        const next = { ...eff, ...patch } as StoryCardEffect;
        // kind変更時にtargetをリセット
        if ('kind' in patch) {
          const opts = TARGET_OPTIONS[next.kind];
          next.target = opts ? opts[0] : '';
          if (NO_TARGET_KINDS.includes(next.kind)) next.target = '';
        }
        return next;
      }),
    );

  const handleSave = () => {
    if (!name.trim()) return;
    const cleanStats: StoryCard['stats'] = {};
    if (stats.yangAttack) cleanStats.yangAttack = stats.yangAttack;
    if (stats.yinAttack) cleanStats.yinAttack = stats.yinAttack;
    if (stats.speed) cleanStats.speed = stats.speed;
    if (stats.yangDefense) cleanStats.yangDefense = stats.yangDefense;
    if (stats.yinDefense) cleanStats.yinDefense = stats.yinDefense;

    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      stats: cleanStats,
      effects,
    });
  };

  return (
    <div className="border border-blue-400 dark:border-blue-600 rounded-lg p-4 bg-blue-50/40 dark:bg-blue-900/10 space-y-4">
      <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
        {initial ? '絵札を編集' : '絵札を追加'}
      </h4>

      {/* 名前 */}
      <div className="flex items-center gap-2">
        <label className="w-10 text-right text-xs text-gray-500 shrink-0">名前</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="絵札名"
          className={inputCls}
        />
      </div>

      {/* ステータス */}
      <div className="space-y-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">ステータス加算</p>
        <div className="grid grid-cols-5 gap-1.5">
          {(
            [
              ['陽攻', 'yangAttack'],
              ['陰攻', 'yinAttack'],
              ['速力', 'speed'],
              ['陽防', 'yangDefense'],
              ['陰防', 'yinDefense'],
            ] as const
          ).map(([label, key]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <span className="text-[9px] text-center text-gray-400">{label}</span>
              <input
                type="number"
                min={0}
                value={stats[key] || ''}
                onChange={(e) => setStat(key)(Number(e.target.value))}
                placeholder="0"
                className={`${inputCls} text-center`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 効果リスト */}
      <div className="space-y-2">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">効果</p>
        {effects.map((eff, i) => {
          const opts = TARGET_OPTIONS[eff.kind];
          const noTarget = NO_TARGET_KINDS.includes(eff.kind);
          return (
            <div key={i} className="flex flex-wrap items-center gap-1.5 text-xs">
              {/* kind */}
              <select
                value={eff.kind}
                onChange={(e) =>
                  updateEffect(i, { kind: e.target.value as StoryCardEffectKind })
                }
                className={selectCls}
              >
                {ALL_KINDS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>

              {/* target */}
              {!noTarget && (
                opts ? (
                  <select
                    value={eff.target}
                    onChange={(e) => updateEffect(i, { target: e.target.value })}
                    className={selectCls}
                  >
                    {opts.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={eff.target}
                    onChange={(e) => updateEffect(i, { target: e.target.value })}
                    placeholder="対象"
                    className="w-16 px-1.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                )
              )}

              {/* value */}
              <input
                type="number"
                value={eff.value}
                onChange={(e) => updateEffect(i, { value: Number(e.target.value) })}
                className="w-14 px-1.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs focus:outline-none text-right"
              />

              {/* condition */}
              <select
                value={eff.condition ?? ''}
                onChange={(e) =>
                  updateEffect(i, {
                    condition: e.target.value ? (e.target.value as CharacterClass) : undefined,
                  })
                }
                className={selectCls}
              >
                <option value="">全式</option>
                {ALL_CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* 削除 */}
              <button
                type="button"
                onClick={() => removeEffect(i)}
                className="text-red-400 hover:text-red-600 text-xs px-1"
              >
                ✕
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addEffect}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          + 効果を追加
        </button>
      </div>

      {/* ボタン */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
        >
          保存
        </button>
      </div>
    </div>
  );
}
