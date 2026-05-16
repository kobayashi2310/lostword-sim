'use client';

import { useMemo, useState } from 'react';
import type { StoryCard } from '@/types';
import { DEFAULT_STORY_CARDS } from '@/lib/data/storyCards';

export function useStoryCards() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const filteredCards = useMemo(() => {
    return DEFAULT_STORY_CARDS.filter((card) => {
      // 名前検索
      const matchName = card.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // 効果タグ検索
      const matchTags =
        filterTags.length === 0 ||
        filterTags.every((tag) =>
          card.effects.some((eff) => {
            const effectStr = `${eff.kind}${eff.target}`;
            return effectStr.includes(tag);
          }),
        );

      return matchName && matchTags;
    });
  }, [searchQuery, filterTags]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    DEFAULT_STORY_CARDS.forEach((card) => {
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
  }, []);

  const toggleTag = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return {
    searchQuery,
    setSearchQuery,
    filterTags,
    toggleTag,
    filteredCards,
    allTags,
  };
}
