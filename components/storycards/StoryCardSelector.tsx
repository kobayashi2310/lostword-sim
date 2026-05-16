'use client';

import React from 'react';
import type { StoryCard, CharacterClass } from '@/types';
import { useStoryCards } from '@/lib/hooks/useStoryCards';
import { useStoryCardDatabase } from '@/lib/hooks/useStoryCardDatabase';
import StoryCardManager from './StoryCardManager';

interface Props {
  equippedCards: (StoryCard | null)[];
  onCardsChange: (cards: (StoryCard | null)[]) => void;
  characterClass: CharacterClass;
}

export default function StoryCardSelector({
  equippedCards,
  onCardsChange,
  characterClass,
}: Props) {
  const db = useStoryCardDatabase();
  const { searchQuery, setSearchQuery, filterTags, toggleTag, filteredCards, allTags } =
    useStoryCards(db.cards);

  const isDev = process.env.NODE_ENV === 'development';

  const [activeSlot, setActiveSlot] = React.useState(0);
  const [tab, setTab] = React.useState<'equip' | 'manage'>('equip');

  const equipCard = (card: StoryCard | null) => {
    const next = [...equippedCards];
    next[activeSlot] = card;
    onCardsChange(next);
  };

  return (
    <div className="space-y-4">
      {/* タブ切り替え (管理タブは開発環境のみ) */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['equip', ...(isDev ? (['manage'] as const) : [])] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t === 'equip' ? '装備' : '管理'}
          </button>
        ))}
      </div>

      {/* 装備タブ */}
      {tab === 'equip' && (
        <div className="space-y-6">
          {/* 装備スロット */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              装備スロット
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {equippedCards.map((card, i) => (
                <div
                  key={i}
                  onClick={() => setActiveSlot(i)}
                  className={`
                    relative h-16 rounded-md border-2 transition-all flex flex-col items-center justify-center p-1 cursor-pointer
                    ${
                      activeSlot === i
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="absolute top-0.5 left-1 text-[8px] font-bold text-gray-400">
                    {i === 0 ? '使用中' : `SLOT ${i + 1}`}
                  </span>
                  {card ? (
                    <div className="text-center">
                      <div className="text-[10px] font-bold leading-tight line-clamp-2 dark:text-gray-200">
                        {card.name}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = [...equippedCards];
                          next[i] = null;
                          onCardsChange(next);
                        }}
                        className="text-[10px] text-red-500 hover:text-red-700 mt-0.5"
                      >
                        外す
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-300 italic">空き</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500">
              ※「使用中」スロットの絵札のみ、バフや属性補正が発動します。他のスロットはステータス加算のみ適用されます。
            </p>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* 検索・フィルター */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              絵札を探す (SLOT {activeSlot + 1} に装備)
            </h3>
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

          {/* 絵札リスト */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {filteredCards.map((card) => {
              const isEquippedInCurrentSlot = equippedCards[activeSlot]?.id === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => equipCard(isEquippedInCurrentSlot ? null : card)}
                  className={`flex flex-col text-left p-2.5 rounded-lg border transition-all ${
                    isEquippedInCurrentSlot
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-100">
                      {card.name}
                    </span>
                    {isEquippedInCurrentSlot && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">
                        装備中
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      {Object.entries(card.stats).map(([key, val]) => (
                        <span key={key}>
                          {key
                            .replace('yang', '陽')
                            .replace('yin', '陰')
                            .replace('Attack', '攻')
                            .replace('Defense', '防')
                            .replace('speed', '速力')}
                          +{val}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-0.5">
                      {card.effects.map((eff, i) => (
                        <div
                          key={i}
                          className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight"
                        >
                          ・{eff.condition ? `[${eff.condition}] ` : ''}
                          {eff.target}
                          {eff.kind.includes('UP') ? 'UP' : eff.kind}
                          <span className="font-bold text-gray-700 dark:text-gray-300 ml-0.5">
                            {eff.value}
                            {eff.kind.includes('バフ') || eff.kind.includes('デバフ')
                              ? '段階'
                              : '%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredCards.length === 0 && (
              <div className="col-span-full py-8 text-center text-xs text-gray-400">
                該当する絵札が見つかりません
              </div>
            )}
          </div>
        </div>
      )}

      {/* 管理タブ */}
      {tab === 'manage' && (
        <StoryCardManager
          cards={db.cards}
          onAdd={db.addCard}
          onUpdate={db.updateCard}
          onDelete={db.deleteCard}
          onExport={db.exportJSON}
          onReset={db.resetToDefaults}
          isBuiltIn={db.isBuiltIn}
        />
      )}
    </div>
  );
}
