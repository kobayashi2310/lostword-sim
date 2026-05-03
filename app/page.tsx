'use client';

import { useState } from 'react';
import type { EnemyWeaknessConfig } from '@/types';
import { useSimulation } from '@/lib/hooks/useSimulation';
import { useAppSettings } from '@/lib/hooks/useAppSettings';

// Inputs
import SelfStatsInput from '@/components/stats/SelfStatsInput';
import EnemyStatsInput from '@/components/stats/EnemyStatsInput';
import DamageBonusInput from '@/components/stats/DamageBonusInput';
import SpecialBuffInput from '@/components/stats/SpecialBuffInput';
import AllBuffsPanel from '@/components/buffs/AllBuffsPanel';
import BulletListForm from '@/components/bullets/BulletListForm';
import HitOrderInput from '@/components/hitorder/HitOrderInput';
import SimulationResults from '@/components/results/SimulationResults';

// Layout Components
import Header from '@/components/layout/Header';
import OptionsBar from '@/components/layout/OptionsBar';
import ConfigSidebar from '@/components/layout/ConfigSidebar';
import { ConfigSection } from '@/components/layout/configSections';

const sectionTitle = 'text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4';

export default function Home() {
  const { isDark, layoutMode, tabView, setTabView, toggleTheme, toggleLayoutMode } = useAppSettings();
  const {
    selfStats, setSelfStats,
    enemyStats, setEnemyStats,
    buffs, setBuffs,
    bullets, setBullets,
    hitOrderText, setHitOrderText,
    isGirlReincarnation, setIsGirlReincarnation,
    enemyWeakness, setEnemyWeakness,
    specialAttackActive, setSpecialAttackActive,
    damageBonus, setDamageBonus,
    result,
    validationErrors,
  } = useSimulation();

  const [section, setSection] = useState<ConfigSection>('stats');

  // ============================================================
  // イベントハンドラ
  // ============================================================
  const handleWeaknessChange = (w: EnemyWeaknessConfig) => setEnemyWeakness(w);
  const handleSpecialAttackChange = (bulletId: number, active: boolean) =>
    setSpecialAttackActive((prev) => ({ ...prev, [bulletId]: active }));

  // ============================================================
  // 入力コンテンツのレンダリング
  // ============================================================
  const renderConfigContent = () => {
    switch (section) {
      case 'stats':
        return (
          <div className="max-w-sm space-y-6">
            <div>
              <h2 className={sectionTitle}>自身ステータス</h2>
              <SelfStatsInput stats={selfStats} onChange={setSelfStats} />
            </div>
            <hr className="border-gray-200 dark:border-gray-700" />
            <div>
              <h2 className={sectionTitle}>敵ステータス</h2>
              <EnemyStatsInput stats={enemyStats} onChange={setEnemyStats} />
            </div>
          </div>
        );
      case 'buffs':
        return (
          <div className="max-w-sm">
            <h2 className={sectionTitle}>バフ/デバフ段階</h2>
            <AllBuffsPanel buffs={buffs} onChange={setBuffs} />
          </div>
        );
      case 'bullets':
        return (
          <div className="max-w-2xl">
            <h2 className={sectionTitle}>バレット設定</h2>
            <BulletListForm bullets={bullets} onChange={setBullets} />
          </div>
        );
      case 'hitorder':
        return (
          <div className="max-w-md">
            <h2 className={sectionTitle}>ヒット順</h2>
            <HitOrderInput text={hitOrderText} onChange={setHitOrderText} />
          </div>
        );
      case 'bonus':
        return (
          <div className="max-w-sm">
            <h2 className={sectionTitle}>補正値</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              有利/不利補正・属性/弾種ダメージアップを設定。属性と弾種は加算。
            </p>
            <DamageBonusInput
              bullets={bullets}
              damageBonus={damageBonus}
              onChange={setDamageBonus}
            />
          </div>
        );
      case 'special':
        return (
          <div className="max-w-sm">
            <h2 className={sectionTitle}>特殊バフ</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              蓄力を追加。蓄力同士は加算され、ダメージ式内で × (1 + 蓄力合計) が適用される。
            </p>
            <SpecialBuffInput damageBonus={damageBonus} onChange={setDamageBonus} />
          </div>
        );
      default:
        return null;
    }
  };

  const renderResultsContent = () => {
    if (validationErrors.length > 0) {
      return (
        <div className="p-4">
          <div className="border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
              入力エラー（修正するまで計算されません）
            </h3>
            <ul className="space-y-1">
              {validationErrors.map((err, i) => (
                <li key={i} className="text-xs text-red-600 dark:text-red-400">
                  ⚠ {err}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 text-sm">
          入力内容を変更すると自動計算されます
        </div>
      );
    }

    return (
      <SimulationResults
        result={result}
        bullets={bullets}
        enemyWeakness={enemyWeakness}
        specialAttackActive={specialAttackActive}
        onWeaknessChange={handleWeaknessChange}
        onSpecialAttackChange={handleSpecialAttackChange}
      />
    );
  };

  const sharedOptionsBar = (
    <OptionsBar
      isGirlReincarnation={isGirlReincarnation}
      onGirlReincarnationChange={setIsGirlReincarnation}
      errorCount={validationErrors.length}
      hasResult={!!result}
    />
  );

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${isDark ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Header
        layoutMode={layoutMode}
        tabView={tabView}
        onTabViewChange={setTabView}
        onToggleLayoutMode={toggleLayoutMode}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        hasResult={!!result}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        {layoutMode === 'split' ? (
          <div className="flex flex-1 overflow-hidden">
            {/* 左: 入力エリア */}
            <div className="flex flex-col border-r border-gray-200 dark:border-gray-700 overflow-hidden shrink-0" style={{ width: '480px', minWidth: '320px' }}>
              <ConfigSidebar activeSection={section} onSectionChange={setSection}>
                {renderConfigContent()}
              </ConfigSidebar>
              {sharedOptionsBar}
            </div>
            {/* 右: 結果エリア */}
            <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900/50">{renderResultsContent()}</div>
          </div>
        ) : (
          /* タブモード */
          <>
            <div className="flex flex-1 overflow-hidden">
              {tabView === 'config' ? (
                <ConfigSidebar activeSection={section} onSectionChange={setSection} width="w-36">
                  {renderConfigContent()}
                </ConfigSidebar>
              ) : (
                <div className="flex-1 overflow-y-auto p-5">{renderResultsContent()}</div>
              )}
            </div>
            {sharedOptionsBar}
          </>
        )}
      </main>
    </div>
  );
}
