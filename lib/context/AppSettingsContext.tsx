'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type LayoutMode = 'tab' | 'split';
type TabView = 'config' | 'result';

interface AppSettingsContextType {
  isDark: boolean;
  layoutMode: LayoutMode;
  tabView: TabView;
  setTabView: (v: TabView) => void;
  toggleTheme: () => void;
  toggleLayoutMode: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(
  undefined,
);

export function AppSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDark, setIsDark] = useState(true);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('tab');
  const [tabView, setTabView] = useState<TabView>('config');

  const isInitialMount = useRef(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDark(saved === 'dark');
    }
    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    if (isInitialMount.current) return;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((v) => !v);
  const toggleLayoutMode = () =>
    setLayoutMode((m) => (m === 'tab' ? 'split' : 'tab'));

  return (
    <AppSettingsContext.Provider
      value={{
        isDark,
        layoutMode,
        tabView,
        setTabView,
        toggleTheme,
        toggleLayoutMode,
      }}
    >
      <div className={isDark ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
          {children}
        </div>
      </div>
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error(
      'useAppSettings must be used within an AppSettingsProvider',
    );
  }
  return context;
}
