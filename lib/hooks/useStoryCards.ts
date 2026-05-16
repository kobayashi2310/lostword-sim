'use client';

import { useMemo, useState } from 'react';
import type { StoryCard } from '@/types';

export function useStoryCards(cards: StoryCard[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchName = card.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTags =
        filterTags.length === 0 ||
        filterTags.every((tag) =>
          card.effects.some((eff) => `${eff.kind}${eff.target}`.includes(tag)),
        );
      return matchName && matchTags;
    });
  }, [cards, searchQuery, filterTags]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    cards.forEach((card) => {
      card.effects.forEach((eff) => {
        if (eff.kind === '自身バフ' || eff.kind === '対象デバフ') {
          tags.add(`${eff.target}UP`);
        } else if (eff.kind === '属性ダメージUP') {
          tags.add(`${eff.target}属性UP`);
        } else if (eff.kind === '弾種ダメージUP') {
          tags.add(`${eff.target}UP`);
        }
      });
    });
    return Array.from(tags).sort();
  }, [cards]);

  const toggleTag = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return { searchQuery, setSearchQuery, filterTags, toggleTag, filteredCards, allTags };
}
