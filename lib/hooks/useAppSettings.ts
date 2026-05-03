'use client';

import { useEffect, useRef, useState } from 'react';

type LayoutMode = 'tab' | 'split';

export function useAppSettings() {
  const [isDark, setIsDark] = useState(true);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('tab');
  const [tabView, setTabView] = useState<'config' | 'result'>('config');

  // 初回マウント時のみ localStorage から読み込む
  const isInitialMount = useRef(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved !== null) {
      const dark = saved === 'dark';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDark(dark);
    }
    // 初期読み込み完了
    isInitialMount.current = false;
  }, []);

  // 2回目以降のレンダリングで isDark が変わった時だけ保存する
  useEffect(() => {
    if (isInitialMount.current) return;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((v) => !v);
  const toggleLayoutMode = () =>
    setLayoutMode((m) => (m === 'tab' ? 'split' : 'tab'));

  return {
    isDark,
    layoutMode,
    tabView,
    setTabView,
    toggleTheme,
    toggleLayoutMode,
  };
}
