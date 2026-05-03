'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSettings } from '@/lib/context/AppSettingsContext';

interface Props {
  hasResult?: boolean;
}

const navBtn = (active: boolean) =>
  `px-3 py-1 rounded-md text-sm font-medium transition-colors ${
    active
      ? 'text-blue-600 dark:text-blue-400 font-bold underline underline-offset-4'
      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
  }`;

const tabBtn = (active: boolean) =>
  `px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-600 text-white'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
  }`;

export default function Header({ hasResult = false }: Props) {
  const {
    isDark,
    layoutMode,
    tabView,
    setTabView,
    toggleTheme,
    toggleLayoutMode,
  } = useAppSettings();
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-bold text-gray-900 dark:text-white shrink-0">
          東方LW ダメージ計算
        </h1>

        <nav className="flex items-center gap-1">
          <Link href="/" className={navBtn(isHome)}>
            シミュレーター
          </Link>
          <Link href="/usage" className={navBtn(pathname === '/usage')}>
            使い方
          </Link>
          <Link href="/specs" className={navBtn(pathname === '/specs')}>
            仕様
          </Link>
        </nav>
      </div>

      <div className="w-px h-6 bg-gray-200 dark:border-gray-700 mx-2" />

      {isHome && layoutMode === 'tab' && (
        <div className="flex gap-1">
          <button
            className={tabBtn(tabView === 'config')}
            onClick={() => setTabView('config')}
          >
            設定
          </button>
          <button
            className={tabBtn(tabView === 'result')}
            onClick={() => setTabView('result')}
          >
            結果{hasResult && ' ✓'}
          </button>
        </div>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          onClick={toggleLayoutMode}
          className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {layoutMode === 'tab' ? '分割表示' : 'タブ表示'}
        </button>

        <button
          onClick={toggleTheme}
          className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark ? 'ライト' : 'ダーク'}
        </button>
      </div>
    </header>
  );
}
