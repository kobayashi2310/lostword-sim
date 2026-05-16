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
  onExport: () => void;
  onReset: () => void;
  isBuiltIn: (id: string) => boolean;
}

export default function StoryCardManager({
  cards,
  onAdd,
  onUpdate,
  onDelete,
  onExport,
  onReset,
  isBuiltIn,
}: Props) {
  const { searchQuery, setSearchQuery, filterTags, toggleTag, filteredCards, allTags } =
    useStoryCards(cards);

  const [formMode, setFormMode] = useState<'none' | 'add' | { id: string }>('none');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const editingId = typeof formMode === 'object' ? formMode.id : null;

  const handleSave = (card: StoryCard) => {
    if (editingId) {
      onUpdate(card);
    } else {
      onAdd(card);
    }
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
      {/* 操作ボタン行 */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFormMode('add')}
          className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          + 新規追加
        </button>
        <button
          type="button"
          onClick={onExport}
          className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          JSONエクスポート
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('localStorageをクリアして初期データに戻しますか？')) onReset();
          }}
          className="px-3 py-1.5 text-xs rounded border border-red-300 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          初期化
        </button>
        <span className="ml-auto text-xs text-gray-400 self-center">
          {cards.length}件
        </span>
      </div>

      {/* 追加フォーム */}
      {formMode === 'add' && (
        <StoryCardForm onSave={handleSave} onCancel={() => setFormMode('none')} />
      )}

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* 検索・フィルター */}
      <div className="space-y-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="絵札名で検索..."
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                  filterTags.includes(tag)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800 hover:border-gray-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* カードリスト */}
      <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
        {filteredCards.map((card) => (
          <div key={card.id}>
            {/* 編集フォーム（インライン展開） */}
            {editingId === card.id ? (
              <StoryCardForm
                initial={card}
                onSave={handleSave}
                onCancel={() => setFormMode('none')}
              />
            ) : (
              <div className="flex items-start gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
                      {card.name}
                    </span>
                    {isBuiltIn(card.id) && (
                      <span className="text-[9px] text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-1">
                        初期
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-2 text-[10px] text-amber-600 dark:text-amber-400">
                    {Object.entries(card.stats).map(([k, v]) => (
                      <span key={k}>
                        {k.replace('yangAttack', '陽攻').replace('yinAttack', '陰攻').replace('speed', '速力').replace('yangDefense', '陽防').replace('yinDefense', '陰防')}+{v}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-400 leading-tight">
                    {card.effects.map((e, i) => (
                      <span key={i} className="mr-2">
                        {e.condition ? `[${e.condition}]` : ''}{e.target}{e.kind.includes('UP') ? 'UP' : e.kind} {e.value}{e.kind === '自身バフ' || e.kind === '対象デバフ' ? '段' : '%'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormMode({ id: card.id })}
                    className="px-2 py-1 text-[10px] rounded border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(card.id)}
                    className={`px-2 py-1 text-[10px] rounded border transition-colors ${
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
        {filteredCards.length === 0 && (
          <p className="text-center py-8 text-xs text-gray-400">該当する絵札が見つかりません</p>
        )}
      </div>
    </div>
  );
}
