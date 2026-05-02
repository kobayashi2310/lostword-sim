'use client';

import { useState } from 'react';
import type {
  Bullet,
  ElementalAdvantage,
  EnemyWeaknessConfig,
  SimulationResult,
} from '@/types';
import { hasSpecialAttackCapability } from '@/lib/simulation';
import EnemyWeaknessInput from '@/components/stats/EnemyWeaknessInput';
import { BulletDamageChart, SimHitChart } from './DamageCharts';

interface Props {
  result: SimulationResult;
  bullets: Bullet[];
  enemyWeakness: EnemyWeaknessConfig;
  specialAttackActive: Record<number, boolean>;
  onWeaknessChange: (w: EnemyWeaknessConfig) => void;
  onSpecialAttackChange: (bulletId: number, active: boolean) => void;
}

function fmt(n: number): string {
  return n.toLocaleString();
}

const ADV_BADGE: Record<ElementalAdvantage, string> = {
  有利: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  等倍: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  不利: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
};

// ============================================================
// サマリーカード
// ============================================================
function SummaryCards({ result }: { result: SimulationResult }) {
  const { weightedMultipliers, totalStaticDamage, totalSimDamage } = result;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="col-span-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-4 py-3">
        <div className="text-xs text-green-700 dark:text-green-400 mb-1">
          バレット別 期待値
        </div>
        <div className="text-2xl font-bold text-green-600 dark:text-green-300 font-mono">
          {fmt(totalStaticDamage)}
        </div>
        <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">
          初期バフ固定・属性設定反映
        </div>
      </div>
      <div className="col-span-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg px-4 py-3">
        <div className="text-xs text-yellow-700 dark:text-yellow-400 mb-1">
          シミュ 期待値
        </div>
        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-300 font-mono">
          {fmt(totalSimDamage)}
        </div>
        <div className="text-xs text-yellow-600/70 dark:text-yellow-400/70 mt-0.5">
          ヒット順に沿ったバフ動的変化
        </div>
      </div>
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg px-3 py-3">
        <div className="text-xs text-purple-700 dark:text-purple-400 mb-1">
          加重平均 斬裂
        </div>
        <div className="text-lg font-bold text-purple-600 dark:text-purple-300 font-mono">
          {(weightedMultipliers.slash * 100).toFixed(1)}%
        </div>
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-3">
        <div className="text-xs text-amber-700 dark:text-amber-400 mb-1">
          加重平均 硬質
        </div>
        <div className="text-lg font-bold text-amber-600 dark:text-amber-300 font-mono">
          {(weightedMultipliers.hard * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

// ============================================================
// バレット別表
// ============================================================
function StaticTable({
  result,
  bullets,
}: {
  result: SimulationResult;
  bullets: Bullet[];
}) {
  const thCls =
    'py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400';
  const tdBase = 'py-1.5 px-2 text-xs';
  const total = result.totalStaticDamage;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className={`${thCls} text-left w-6`}>#</th>
            <th className={`${thCls} text-left`}>バレット</th>
            <th className={`${thCls} text-right`}>期待値ダメージ</th>
            <th className={`${thCls} text-right`}>割合</th>
          </tr>
        </thead>
        <tbody>
          {result.bulletStaticResults.map((br) => {
            const bullet = bullets.find((b) => b.id === br.bulletId);
            const mustHit = bullet?.effects.some((e) => e.kind === '必中');
            const special = bullet?.effects.some((e) => e.kind === '特効');
            const pct =
              total > 0 ? ((br.expectedDamage / total) * 100).toFixed(1) : '0';
            return (
              <tr
                key={br.bulletId}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className={`${tdBase} text-gray-400`}>{br.bulletId}</td>
                <td className={`${tdBase} text-gray-700 dark:text-gray-300`}>
                  <span className="font-mono">
                    {bullet?.power.toFixed(2)} ×{bullet?.count}
                  </span>
                  {bullet && (
                    <span className="ml-1.5 text-gray-400">
                      [{bullet.element}/
                      {bullet.yinYang === '陽気' ? '陽' : '陰'}
                      {bullet.slashPercent > 0 && ` 斬${bullet.slashPercent}%`}
                      {bullet.hardPercent > 0 && ` 硬${bullet.hardPercent}%`}]
                    </span>
                  )}
                  {mustHit && (
                    <span className="ml-1 text-green-600 dark:text-green-400">
                      必中
                    </span>
                  )}
                  {special && (
                    <span className="ml-1 text-red-500 dark:text-red-300">
                      特効
                    </span>
                  )}
                  <span
                    className={`ml-1.5 px-1 py-0.5 rounded text-xs ${ADV_BADGE[br.advantage]}`}
                  >
                    {br.advantage}
                  </span>
                </td>
                <td
                  className={`${tdBase} text-right font-mono font-semibold text-green-600 dark:text-green-300`}
                >
                  {fmt(br.expectedDamage)}
                </td>
                <td
                  className={`${tdBase} text-right text-gray-500 dark:text-gray-400`}
                >
                  {pct}%
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
            <td className={`${tdBase} text-gray-400`} />
            <td
              className={`${tdBase} font-semibold text-gray-700 dark:text-gray-200`}
            >
              合計
            </td>
            <td
              className={`${tdBase} text-right font-mono font-semibold text-green-600 dark:text-green-300`}
            >
              {fmt(result.totalStaticDamage)}
            </td>
            <td className={`${tdBase} text-right text-gray-500`}>100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ============================================================
// ヒット順シミュレーション詳細
// ============================================================
function SimulationTable({ result }: { result: SimulationResult }) {
  const thCls =
    'py-1.5 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-left';
  const tdBase = 'py-1 px-2 text-xs';

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className={`${thCls} w-8`}>順</th>
            <th className={thCls}>弾</th>
            <th className={`${thCls} w-14`}>属性</th>
            <th className={`${thCls} text-right`}>期待値ダメージ</th>
            <th className={thCls}>バフ変化</th>
          </tr>
        </thead>
        <tbody>
          {result.hitSequence.map((hit) => (
            <tr
              key={hit.sequenceIndex}
              className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                hit.buffChanges.length > 0
                  ? 'bg-blue-50/50 dark:bg-blue-900/10'
                  : ''
              }`}
            >
              <td className={`${tdBase} text-gray-400`}>
                {hit.sequenceIndex + 1}
              </td>
              <td
                className={`${tdBase} text-gray-700 dark:text-white font-mono`}
              >
                {hit.bulletId}
                {hit.mustHit && (
                  <span className="text-green-600 dark:text-green-400 ml-1">
                    必中
                  </span>
                )}
                {hit.specialAttack && (
                  <span className="text-red-500 dark:text-red-300 ml-1">
                    特効
                  </span>
                )}
              </td>
              <td className={tdBase}>
                <span
                  className={`px-1 py-0.5 rounded text-xs ${ADV_BADGE[hit.elementalAdvantage]}`}
                >
                  {hit.elementalAdvantage}
                </span>
              </td>
              <td
                className={`${tdBase} text-right font-mono text-green-600 dark:text-green-300`}
              >
                {fmt(hit.expectedDamage)}
              </td>
              <td className={`${tdBase} text-cyan-600 dark:text-cyan-400`}>
                {hit.buffChanges.length > 0 ? (
                  hit.buffChanges.map((c) => c.label).join(' / ')
                ) : (
                  <span className="text-gray-300 dark:text-gray-700">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// メイン
// ============================================================
export default function SimulationResults({
  result,
  bullets,
  enemyWeakness,
  specialAttackActive,
  onWeaknessChange,
  onSpecialAttackChange,
}: Props) {
  const [tab, setTab] = useState<'static' | 'sim'>('static');
  const specialBullets = bullets.filter((b) =>
    hasSpecialAttackCapability(b.effects),
  );

  const tabCls = (active: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
      active
        ? 'text-blue-600 dark:text-white border-blue-500'
        : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
    }`;

  return (
    <div className="space-y-4">
      <SummaryCards result={result} />

      {/* 特効設定 */}
      {specialBullets.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            特効（変更すると即時再計算）
          </h3>
          <div className="flex flex-wrap gap-3">
            {specialBullets.map((b) => {
              const active = specialAttackActive[b.id] ?? false;
              return (
                <div key={b.id} className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    バレット{b.id}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    特効
                  </span>
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      onClick={() => onSpecialAttackChange(b.id, val)}
                      className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                        active === val
                          ? val
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-400 dark:border-red-600'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-500'
                          : 'bg-transparent text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {val ? '〇' : '×'}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 属性弱点設定 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          敵属性弱点（変更すると即時再計算）
        </h3>
        <EnemyWeaknessInput
          weakness={enemyWeakness}
          onChange={onWeaknessChange}
        />
      </div>

      {/* サブタブ */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={tabCls(tab === 'static')}
          onClick={() => setTab('static')}
        >
          バレット別
        </button>
        <button className={tabCls(tab === 'sim')} onClick={() => setTab('sim')}>
          ヒット順シミュレーション
        </button>
      </div>

      {tab === 'static' ? (
        <>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <BulletDamageChart
              bulletStaticResults={result.bulletStaticResults}
              bullets={bullets}
              totalDamage={result.totalStaticDamage}
            />
          </div>
          <StaticTable result={result} bullets={bullets} />
        </>
      ) : (
        <>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <SimHitChart hitSequence={result.hitSequence} />
          </div>
          <SimulationTable result={result} />
        </>
      )}
    </div>
  );
}
