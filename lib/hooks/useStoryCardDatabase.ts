'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StoryCard } from '@/types';
import { DEFAULT_STORY_CARDS } from '@/lib/data/storyCards';

const API = '/api/story-cards';

async function fetchCards(): Promise<StoryCard[]> {
  try {
    const res = await fetch(API);
    if (!res.ok) return DEFAULT_STORY_CARDS;
    return res.json();
  } catch {
    return DEFAULT_STORY_CARDS;
  }
}

async function saveCards(cards: StoryCard[]): Promise<void> {
  const res = await fetch(API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cards),
  });
  if (!res.ok) throw new Error(`save failed: ${res.status}`);
}

const defaultIds = new Set(DEFAULT_STORY_CARDS.map((c) => c.id));

export function useStoryCardDatabase() {
  const [cards, setCards] = useState<StoryCard[]>(DEFAULT_STORY_CARDS);

  useEffect(() => {
    fetchCards().then(setCards);
  }, []);

  const persist = useCallback(async (next: StoryCard[], prev: StoryCard[]) => {
    setCards(next);
    try {
      await saveCards(next);
    } catch (e) {
      console.error(e);
      setCards(prev);
    }
  }, []);

  const addCard = useCallback(
    (card: StoryCard) => persist([...cards, card], cards),
    [cards, persist],
  );

  const updateCard = useCallback(
    (card: StoryCard) =>
      persist(cards.map((c) => (c.id === card.id ? card : c)), cards),
    [cards, persist],
  );

  const deleteCard = useCallback(
    (id: string) => persist(cards.filter((c) => c.id !== id), cards),
    [cards, persist],
  );

  const isBuiltIn = useCallback((id: string) => defaultIds.has(id), []);

  return { cards, addCard, updateCard, deleteCard, isBuiltIn };
}
