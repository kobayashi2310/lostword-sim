'use client';

import React, { useState } from 'react';
import type { StoryCard } from '@/types';
import { useStoryCards } from '@/lib/hooks/useStoryCards';
import StoryCardForm from './StoryCardForm';

interface Props {
  cards: StoryCard[];
  onAdd: (card: StoryCard) => void;
  onUpdate: (card: StoryCard) => void;
  onDelete: (id: string) => void;
  isBuiltIn: (id: string) => boolean;
}

function statLabel(key: string): string {
  return key
    .replace('yangAttack', '陽攻')
    .replace('yinAttack', '陰攻')
    .replace('speed', '速力')
    .replace('yangDefense', '陽防')
    .replace('yinDefense', '陰防');
}

export default function StoryCardManager({
  cards,
  onAdd,
  onUpdate,
  onDelete,
  isBuiltIn,
}: Props) {
  const { searchQuery, setSearchQuery, filteredCards } = useStoryCards(cards);
  const [formMode, setFormMode] = useState<'none' | 'add' | { id: string }>(
    'none',
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const editingId = typeof formMode === 'object' ? formMode.id : null;

  const handleSave = (card: StoryCard) => {
    editingId ? onUpdate(card) : onAdd(card);
    setFormMode('none');
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* 操作行 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setFormMode('add')}
          className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          + 新規追加
        </button>
        <span className="ml-auto text-sm text-gray-400">{cards.length}件</span>
      </div>

      {formMode === 'add' && (
        <StoryCardForm
          onSave={handleSave}
          onCancel={() => setFormMode('none')}
        />
      )}

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* 名前検索 */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="絵札名で検索..."
        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
      />

      {/* カードリスト */}
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {filteredCards.map((card) => (
          <div key={card.id}>
            {editingId === card.id ? (
              <StoryCardForm
                initial={card}
                onSave={handleSave}
                onCancel={() => setFormMode('none')}
              />
            ) : (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                      {card.name}
                    </span>
                    {isBuiltIn(card.id) && (
                      <span className="text-xs text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 shrink-0">
                        初期
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-amber-600 dark:text-amber-400 mb-0.5">
                    {Object.entries(card.stats).map(([k, v]) => (
                      <span key={k}>
                        {statLabel(k)}+{v}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 dark:text-gray-400">
                    {card.effects.map((e, i) => (
                      <span key={i}>
                        {e.condition ? `[${e.condition}] ` : ''}
                        {e.target}
                        {e.kind.includes('UP') ? 'UP' : e.kind} {e.value}
                        {e.kind === '自身バフ' || e.kind === '対象デバフ'
                          ? '段'
                          : '%'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormMode({ id: card.id })}
                    className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(card.id)}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                      confirmDeleteId === card.id
                        ? 'bg-red-500 text-white border-red-500'
                        : 'border-gray-300 dark:border-gray-600 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                  >
                    {confirmDeleteId === card.id ? '確認' : '削除'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {searchQuery.trim() === '' ? (
          <p className="text-center py-10 text-sm text-gray-400">
            絵札名・効果・ステータスで検索してください
          </p>
        ) : (
          filteredCards.length === 0 && (
            <p className="text-center py-10 text-sm text-gray-400">
              該当する絵札が見つかりません
            </p>
          )
        )}
      </div>
    </div>
  );
}
