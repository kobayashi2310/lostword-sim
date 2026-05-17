'use client';

import { useMemo, useState } from 'react';
import type { StoryCard } from '@/types';

const STAT_LABEL: Record<string, string> = {
  yangAttack: '陽攻',
  yinAttack: '陰攻',
  speed: '速力',
  yangDefense: '陽防',
  yinDefense: '陰防',
};

function cardSearchText(card: StoryCard): string {
  const parts: string[] = [card.name];

  // ステータス名
  for (const key of Object.keys(card.stats)) {
    if (STAT_LABEL[key]) parts.push(STAT_LABEL[key]);
  }

  // 効果 (種別・対象・条件)
  for (const eff of card.effects) {
    parts.push(eff.kind, eff.target);
    if (eff.condition) parts.push(eff.condition);
  }

  return parts.join(' ').toLowerCase();
}

export function useStoryCards(cards: StoryCard[]) {
  const [searchQuery, setSearchQuery] = useState('');

  // カードごとの検索文字列をメモ化
  const searchTexts = useMemo(
    () => cards.map((card) => cardSearchText(card)),
    [cards],
  );

  const filteredCards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return cards.filter((_, i) => searchTexts[i].includes(q));
  }, [cards, searchTexts, searchQuery]);

  return { searchQuery, setSearchQuery, filteredCards };
}
