'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  Bullet,
  BuffStages,
  DamageBonus,
  EnemyStats,
  EnemyWeaknessConfig,
  SelfStats,
  SimulationResult,
} from '@/types';
import { createDefaultDamageBonus, createDefaultWeakness } from '@/types';
import { buffValidationMessages } from '@/lib/buffs';
import {
  DEFAULT_BUFF_STAGES,
  DEFAULT_BULLETS,
  DEFAULT_ENEMY_STATS,
  DEFAULT_HIT_ORDER_TEXT,
  DEFAULT_SELF_STATS,
} from '@/lib/defaultData';
import {
  hasSpecialAttackCapability,
  parseHitOrder,
  runSimulation,
  validateHitOrder,
} from '@/lib/simulation';
import SelfStatsInput from '@/components/stats/SelfStatsInput';
import EnemyStatsInput from '@/components/stats/EnemyStatsInput';
import DamageBonusInput from '@/components/stats/DamageBonusInput';
import AllBuffsPanel from '@/components/buffs/AllBuffsPanel';
import BulletListForm from '@/components/bullets/BulletListForm';
import HitOrderInput from '@/components/hitorder/HitOrderInput';
import SimulationResults from '@/components/results/SimulationResults';

// ============================================================
// 定数
// ============================================================
type LayoutMode = 'tab' | 'split';
type ConfigSection = 'stats' | 'buffs' | 'bullets' | 'hitorder' | 'bonus';

const CONFIG_SECTIONS: { id: ConfigSection; label: string }[] = [
  { id: 'stats', label: 'ステータス' },
  { id: 'buffs', label: 'バフ/デバフ' },
  { id: 'bullets', label: 'バレット' },
  { id: 'hitorder', label: 'ヒット順' },
  { id: 'bonus', label: '補正値' },
];

// デフォルトの特効アクティブ状態
function initSpecialAttackActive(bullets: Bullet[]): Record<number, boolean> {
  const sa: Record<number, boolean> = {};
  for (const b of bullets) {
    if (hasSpecialAttackCapability(b.effects)) sa[b.id] = true;
  }
  return sa;
}

// ============================================================
// メインページ
// ============================================================
export default function Home() {
  // テーマ: lazy初期化でlocalStorageから読み込み（useEffect不要）
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('theme');
    return saved !== null ? saved === 'dark' : true;
  });
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('tab');
  const [tabView, setTabView] = useState<'config' | 'result'>('config');
  const [section, setSection] = useState<ConfigSection>('stats');

  const [selfStats, setSelfStats] = useState<SelfStats>(DEFAULT_SELF_STATS);
  const [enemyStats, setEnemyStats] = useState<EnemyStats>(DEFAULT_ENEMY_STATS);
  const [buffs, setBuffs] = useState<BuffStages>(DEFAULT_BUFF_STAGES);
  const [bullets, setBullets] = useState<Bullet[]>(DEFAULT_BULLETS);
  const [hitOrderText, setHitOrderText] = useState<string>(
    DEFAULT_HIT_ORDER_TEXT,
  );
  const [isGirlReincarnation, setIsGirlReincarnation] = useState(false);

  const [enemyWeakness, setEnemyWeakness] = useState<EnemyWeaknessConfig>(
    createDefaultWeakness,
  );
  const [specialAttackActive, setSpecialAttackActive] = useState<
    Record<number, boolean>
  >(() => initSpecialAttackActive(DEFAULT_BULLETS));
  const [damageBonus, setDamageBonus] = useState<DamageBonus>(
    createDefaultDamageBonus,
  );

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // テーマ変更時に localStorage へ保存
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // バレット変更時に特効状態を同期（useRefで前の値を保持し setState ループを防ぐ）
  const prevBulletsRef = useRef<Bullet[]>(DEFAULT_BULLETS);
  useEffect(() => {
    if (bullets === prevBulletsRef.current) return;
    prevBulletsRef.current = bullets;
    setSpecialAttackActive((prev) => {
      const next: Record<number, boolean> = {};
      for (const b of bullets) {
        if (hasSpecialAttackCapability(b.effects)) {
          next[b.id] = prev[b.id] ?? true;
        }
      }
      return next;
    });
  }, [bullets]);

  // ============================================================
  // 自動再計算（300msデバウンス）
  // ============================================================
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const hitOrder = parseHitOrder(hitOrderText);

      const errors: string[] = [
        ...buffValidationMessages(buffs),
        ...validateHitOrder(bullets, hitOrder).map((e) => e.message),
      ];
      setValidationErrors(errors);

      if (errors.length > 0) {
        setResult(null);
        return;
      }

      setResult(
        runSimulation({
          selfStats,
          enemyStats,
          initialBuffs: buffs,
          bullets,
          hitOrder,
          isGirlReincarnation,
          enemyWeakness,
          specialAttackActive,
          damageBonus,
        }),
      );
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    selfStats,
    enemyStats,
    buffs,
    bullets,
    hitOrderText,
    isGirlReincarnation,
    enemyWeakness,
    specialAttackActive,
    damageBonus,
  ]);

  // ============================================================
  // 結果タブ用ハンドラ（setterを更新するだけ — useEffect が再計算）
  // ============================================================
  const handleWeaknessChange = (w: EnemyWeaknessConfig) => setEnemyWeakness(w);
  const handleSpecialAttackChange = (bulletId: number, active: boolean) =>
    setSpecialAttackActive((prev) => ({ ...prev, [bulletId]: active }));

  // ============================================================
  // スタイル定数
  // ============================================================
  const pageBase = `h-screen flex flex-col overflow-hidden ${
    isDark ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
  }`;
  const sideNavBtn = (active: boolean) =>
    `w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
      active
        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;
  const tabBtn = (active: boolean) =>
    `px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`;
  const sectionTitle =
    'text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4';

  // ============================================================
  // 入力エリア（JSX変数 — コンポーネント定義にするとアンマウントが起きる）
  // ============================================================
  const configContent = (
    <>
      {section === 'stats' && (
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
      )}
      {section === 'buffs' && (
        <div className="max-w-sm">
          <h2 className={sectionTitle}>バフ/デバフ段階</h2>
          <AllBuffsPanel buffs={buffs} onChange={setBuffs} />
        </div>
      )}
      {section === 'bullets' && (
        <div className="max-w-2xl">
          <h2 className={sectionTitle}>バレット設定</h2>
          <BulletListForm bullets={bullets} onChange={setBullets} />
        </div>
      )}
      {section === 'hitorder' && (
        <div className="max-w-md">
          <h2 className={sectionTitle}>ヒット順</h2>
          <HitOrderInput text={hitOrderText} onChange={setHitOrderText} />
        </div>
      )}
      {section === 'bonus' && (
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
      )}
    </>
  );

  // ============================================================
  // 結果エリア
  // ============================================================
  const resultsContent =
    validationErrors.length > 0 ? (
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
    ) : !result ? (
      <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 text-sm">
        入力内容を変更すると自動計算されます
      </div>
    ) : (
      <SimulationResults
        result={result}
        bullets={bullets}
        enemyWeakness={enemyWeakness}
        specialAttackActive={specialAttackActive}
        onWeaknessChange={handleWeaknessChange}
        onSpecialAttackChange={handleSpecialAttackChange}
      />
    );

  // ============================================================
  // オプション行
  // ============================================================
  const optionsBar = (
    <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 flex items-center gap-3">
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={isGirlReincarnation}
          onChange={(e) => setIsGirlReincarnation(e.target.checked)}
          className="w-3.5 h-3.5 accent-blue-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          少女転生（×140）
        </span>
      </label>
      {validationErrors.length > 0 && (
        <span className="text-xs text-red-500 dark:text-red-400">
          ⚠ {validationErrors.length}件のエラー
        </span>
      )}
      {validationErrors.length === 0 && result && (
        <span className="text-xs text-green-600 dark:text-green-400">
          ✓ 計算済み
        </span>
      )}
    </div>
  );

  // ============================================================
  // レンダリング
  // ============================================================
  return (
    <div className={pageBase}>
      {/* ─── ヘッダー ─── */}
      <header className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        <h1 className="text-base font-bold text-gray-900 dark:text-white mr-2 shrink-0">
          東方LW ダメージ計算
        </h1>

        {/* タブモードのみ：タブ切り替え */}
        {layoutMode === 'tab' && (
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
              結果{result && ' ✓'}
            </button>
          </div>
        )}

        <div className="flex-1" />

        {/* レイアウト切り替え */}
        <button
          onClick={() => setLayoutMode((m) => (m === 'tab' ? 'split' : 'tab'))}
          className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={
            layoutMode === 'tab'
              ? '左右分割表示に切り替え'
              : 'タブ表示に切り替え'
          }
        >
          {layoutMode === 'tab' ? '分割表示' : 'タブ表示'}
        </button>

        {/* テーマ切り替え */}
        <button
          onClick={() => setIsDark((v) => !v)}
          className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark ? 'ライト' : 'ダーク'}
        </button>
      </header>

      {/* ─── ボディ ─── */}
      {layoutMode === 'split' ? (
        /* ========== 分割モード ========== */
        <div className="flex flex-1 overflow-hidden">
          {/* 左: 入力 */}
          <div
            className="flex flex-col border-r border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{ width: '480px', minWidth: '320px' }}
          >
            <div className="flex flex-1 overflow-hidden">
              {/* サイドナビ */}
              <nav className="w-32 shrink-0 border-r border-gray-200 dark:border-gray-700 p-2 space-y-0.5 bg-white dark:bg-gray-800">
                {CONFIG_SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    className={sideNavBtn(section === s.id)}
                    onClick={() => setSection(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>
              {/* コンテンツ */}
              <div className="flex-1 overflow-y-auto p-4">{configContent}</div>
            </div>
            {optionsBar}
          </div>

          {/* 右: 結果 */}
          <div className="flex-1 overflow-y-auto p-4">{resultsContent}</div>
        </div>
      ) : (
        /* ========== タブモード ========== */
        <>
          {tabView === 'config' ? (
            <div className="flex flex-1 overflow-hidden">
              <nav className="w-36 shrink-0 border-r border-gray-200 dark:border-gray-700 p-2 space-y-0.5 bg-white dark:bg-gray-800">
                {CONFIG_SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    className={sideNavBtn(section === s.id)}
                    onClick={() => setSection(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>
              <div className="flex-1 overflow-y-auto p-5">{configContent}</div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5">{resultsContent}</div>
          )}
          {/* フッター（タブモードのみ） */}
          {optionsBar}
        </>
      )}
    </div>
  );
}
