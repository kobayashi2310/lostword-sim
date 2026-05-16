'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StoryCard } from '@/types';
import { DEFAULT_STORY_CARDS } from '@/lib/data/storyCards';

const LS_KEY = 'lostword_story_cards';

const defaultIds = new Set(DEFAULT_STORY_CARDS.map((c) => c.id));

function loadFromStorage(): StoryCard[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoryCard[];
  } catch {
    return null;
  }
}

function saveToStorage(cards: StoryCard[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(cards));
}

export function useStoryCardDatabase() {
  const [cards, setCards] = useState<StoryCard[]>(DEFAULT_STORY_CARDS);

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) setCards(stored);
  }, []);

  const persist = useCallback((next: StoryCard[]) => {
    setCards(next);
    saveToStorage(next);
  }, []);

  const addCard = useCallback(
    (card: StoryCard) => {
      persist([...cards, card]);
    },
    [cards, persist],
  );

  const updateCard = useCallback(
    (card: StoryCard) => {
      persist(cards.map((c) => (c.id === card.id ? card : c)));
    },
    [cards, persist],
  );

  const deleteCard = useCallback(
    (id: string) => {
      persist(cards.filter((c) => c.id !== id));
    },
    [cards, persist],
  );

  const isBuiltIn = useCallback((id: string) => defaultIds.has(id), []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(cards, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storyCards.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [cards]);

  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setCards(DEFAULT_STORY_CARDS);
  }, []);

  return { cards, addCard, updateCard, deleteCard, isBuiltIn, exportJSON, resetToDefaults };
}
