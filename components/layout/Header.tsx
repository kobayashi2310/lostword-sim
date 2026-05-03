'use client';

type TabView = 'config' | 'result';
type LayoutMode = 'tab' | 'split';

interface Props {
  layoutMode: LayoutMode;
  tabView: TabView;
  onTabViewChange: (v: TabView) => void;
  onToggleLayoutMode: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
  hasResult: boolean;
}

const tabBtn = (active: boolean) =>
  `px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-600 text-white'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
  }`;

export default function Header({
  layoutMode,
  tabView,
  onTabViewChange,
  onToggleLayoutMode,
  onToggleTheme,
  isDark,
  hasResult,
}: Props) {
  return (
    <header className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
      <h1 className="text-base font-bold text-gray-900 dark:text-white mr-2 shrink-0">
        東方LW ダメージ計算
      </h1>

      {layoutMode === 'tab' && (
        <div className="flex gap-1">
          <button
            className={tabBtn(tabView === 'config')}
            onClick={() => onTabViewChange('config')}
          >
            設定
          </button>
          <button
            className={tabBtn(tabView === 'result')}
            onClick={() => onTabViewChange('result')}
          >
            結果{hasResult && ' ✓'}
          </button>
        </div>
      )}

      <div className="flex-1" />

      <button
        onClick={onToggleLayoutMode}
        className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {layoutMode === 'tab' ? '分割表示' : 'タブ表示'}
      </button>

      <button
        onClick={onToggleTheme}
        className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {isDark ? 'ライト' : 'ダーク'}
      </button>
    </header>
  );
}
