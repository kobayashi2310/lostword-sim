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

const STAT_KEYS = ['yangAttack', 'yinAttack', 'speed', 'yangDefense', 'yinDefense'] as const;
type StatKey = (typeof STAT_KEYS)[number];

const STAT_LABELS: Record<StatKey, string> = {
  yangAttack: '陽攻',
  yinAttack: '陰攻',
  speed: '速力',
  yangDefense: '陽防',
  yinDefense: '陰防',
};

const TARGET_OPTIONS: Partial<Record<StoryCardEffectKind, string[]>> = {
  自身バフ: ['陽攻', '陰攻', '速力', '陽防', '陰防', '命中', 'CRI攻撃', 'CRI命中'],
  対象デバフ: ['陽防', '陰防', 'CRI防御', 'CRI回避'],
  属性ダメージUP: ['無', '火', '水', '木', '金', '土', '日', '月', '星', '天'],
  弾種ダメージUP: ['通常弾', 'レーザー弾', '肉弾', '符弾', '斬撃弾', '貫通弾'],
};

const NO_TARGET_KINDS: StoryCardEffectKind[] = ['霊力上昇', '結界増加', 'ダメージ軽減'];

const MAX_STATS = 2;
const MAX_EFFECTS = 3;

const inputCls =
  'px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 dark:focus:border-blue-400';
const selectCls =
  'px-1.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 dark:focus:border-blue-400';

interface StatEntry {
  key: StatKey;
  value: number;
}

function initialStats(card?: StoryCard): [StatEntry, StatEntry] {
  const entries = card
    ? (Object.entries(card.stats) as [StatKey, number][])
        .filter(([, v]) => v !== undefined)
        .map(([key, value]) => ({ key, value }))
    : [];
  return [
    entries[0] ?? { key: 'yangAttack' as StatKey, value: 0 },
    entries[1] ?? { key: 'yinAttack' as StatKey, value: 0 },
  ];
}

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
  const [statEntries, setStatEntries] = useState<[StatEntry, StatEntry]>(() => initialStats(initial));
  const [effects, setEffects] = useState<StoryCardEffect[]>(
    initial?.effects?.length ? initial.effects : [emptyEffect()],
  );

  // ステータス操作（2枠固定）
  const updateStat = (i: 0 | 1, patch: Partial<StatEntry>) =>
    setStatEntries((prev) => {
      const next: [StatEntry, StatEntry] = [{ ...prev[0] }, { ...prev[1] }];
      next[i] = { ...next[i], ...patch };
      return next;
    });

  // 効果操作（最低1件）
  const addEffect = () => {
    if (effects.length >= MAX_EFFECTS) return;
    setEffects((prev) => [...prev, emptyEffect()]);
  };

  const removeEffect = (i: number) => {
    if (effects.length <= 1) return;
    setEffects((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateEffect = (i: number, patch: Partial<StoryCardEffect>) =>
    setEffects((prev) =>
      prev.map((eff, idx) => {
        if (idx !== i) return eff;
        const next = { ...eff, ...patch } as StoryCardEffect;
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
    statEntries.forEach(({ key, value }) => {
      if (value) cleanStats[key] = value;
    });
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      stats: cleanStats,
      effects,
    });
  };

  const usedStatKeys = new Set(statEntries.map((e) => e.key));
  const canRemoveEffect = effects.length > 1;

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
          className={`${inputCls} flex-1`}
        />
      </div>

      {/* ステータス補正 (2枠固定) */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">ステータス補正</p>
        {([0, 1] as const).map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <select
              value={statEntries[i].key}
              onChange={(e) => updateStat(i, { key: e.target.value as StatKey })}
              className={selectCls}
            >
              {STAT_KEYS.map((k) => (
                <option key={k} value={k} disabled={usedStatKeys.has(k) && k !== statEntries[i].key}>
                  {STAT_LABELS[k]}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-400">+</span>
            <input
              type="number"
              min={0}
              value={statEntries[i].value || ''}
              onChange={(e) => updateStat(i, { value: Number(e.target.value) })}
              placeholder="0"
              className={`${inputCls} w-20 text-right`}
            />
          </div>
        ))}
      </div>

      {/* 効果 (1〜3件) */}
      <div className="space-y-2">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">
          効果 ({effects.length}/{MAX_EFFECTS})
        </p>
        {effects.map((eff, i) => {
          const opts = TARGET_OPTIONS[eff.kind];
          const noTarget = NO_TARGET_KINDS.includes(eff.kind);
          return (
            <div key={i} className="flex flex-wrap items-center gap-1.5">
              <select
                value={eff.kind}
                onChange={(e) => updateEffect(i, { kind: e.target.value as StoryCardEffectKind })}
                className={selectCls}
              >
                {ALL_KINDS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>

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
                    className={`${inputCls} w-16`}
                  />
                )
              )}

              <input
                type="number"
                value={eff.value}
                onChange={(e) => updateEffect(i, { value: Number(e.target.value) })}
                className={`${inputCls} w-14 text-right`}
              />

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

              {canRemoveEffect && (
                <button
                  type="button"
                  onClick={() => removeEffect(i)}
                  className="text-red-400 hover:text-red-600 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
        {effects.length < MAX_EFFECTS && (
          <button
            type="button"
            onClick={addEffect}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            + 効果を追加
          </button>
        )}
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
