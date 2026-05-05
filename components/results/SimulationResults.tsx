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
      <div className="col-span-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg px-4 py-3">
        <div className="text-xs text-yellow-700 dark:text-yellow-400 mb-1">
          シミュ 期待値合計
        </div>
        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-300 font-mono">
          {fmt(totalSimDamage)}
        </div>
        <div className="text-xs text-yellow-600/70 dark:text-yellow-400/70 mt-0.5">
          ヒット順・バフ変化・FBをすべて考慮
        </div>
      </div>
      <div className="col-span-2 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 opacity-60">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          参考：初期バフ固定値
        </div>
        <div className="text-lg font-bold text-gray-400 dark:text-gray-500 font-mono">
          {fmt(totalStaticDamage)}
        </div>
        <div className="text-xs text-gray-400/70 mt-0.5">バフ変化なしの状態</div>
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
// バレット別表 (シミュレーション結果の集計)
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
  const total = result.totalSimDamage;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className={`${thCls} text-left w-6`}>#</th>
            <th className={`${thCls} text-left`}>バレット</th>
            <th className={`${thCls} text-right`}>シミュ合計ダメージ</th>
            <th className={`${thCls} text-right`}>割合</th>
          </tr>
        </thead>
        <tbody>
          {result.bulletSimResults.map((br) => {
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
              {fmt(result.totalSimDamage)}
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
function SimulationTable({
  result,
  bullets,
}: {
  result: SimulationResult;
  bullets: Bullet[];
}) {
  const thCls =
    'py-1.5 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-left';
  const tdBase = 'py-1 px-2 text-xs';

  const [openDetailIndex, setOpenDetailIndex] = useState<number | null>(null);

  const getBuffLabel = (field: string) => {
    const labels: Record<string, string> = {
      yangAttackR1: '陽攻R1',
      yangAttackR2: '陽攻R2',
      yinAttackR1: '陰攻R1',
      yinAttackR2: '陰攻R2',
      speedR1: '速力R1',
      speedR2: '速力R2',
      selfYangDefR1: '自陽防R1',
      selfYangDefR2: '自陽防R2',
      selfYinDefR1: '自陰防R1',
      selfYinDefR2: '自陰防R2',
      enemyYangDefR1: '敵陽防R1',
      enemyYangDefR2: '敵陽防R2',
      enemyYinDefR1: '敵陰防R1',
      enemyYinDefR2: '敵陰防R2',
      selfHitR1: '命中R1',
      selfHitR2: '命中R2',
      enemyEvasionR1: '敵回避R1',
      enemyEvasionR2: '敵回避R2',
      selfCriAttackR1: '自CRI攻R1',
      selfCriAttackR2: '自CRI攻R2',
      selfCriHitR1: '自CRI命R1',
      selfCriHitR2: '自CRI命R2',
      enemyCriDefR1: '敵CRI防R1',
      enemyCriEvasionR1: '敵CRI避R1',
    };
    return labels[field] || field;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className={`${thCls} w-8`}>順</th>
            <th className={thCls}>弾</th>
            <th className={`${thCls} w-14`}>属性</th>
            <th className={`${thCls} w-12`}>結界</th>
            <th className={`${thCls} text-right`}>期待値ダメージ</th>
            <th className={`${thCls} w-20`}>状態</th>
            <th className={thCls}>バフ変化</th>
          </tr>
        </thead>
        <tbody>
          {result.hitSequence.map((hit, idx) => {
            const bullet = bullets.find((b) => b.id === hit.bulletId);
            const b = hit.buffStateBefore;
            const isYang = bullet?.yinYang === '陽気';
            const atk = isYang
              ? b.yangAttackR1 + b.yangAttackR2
              : b.yinAttackR1 + b.yinAttackR2;
            const eDef = isYang
              ? b.enemyYangDefR1 + b.enemyYangDefR2
              : b.enemyYinDefR1 + b.enemyYinDefR2;
            const eDefDisplay = hit.isFullBreakBefore
              ? 'FB'
              : eDef > 0
                ? `+${eDef}`
                : eDef;

            return (
              <tr
                key={hit.sequenceIndex}
                className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                  hit.isFullBreak
                    ? 'bg-red-50/30 dark:bg-red-900/10'
                    : hit.buffChanges.length > 0
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
                <td className={tdBase}>
                  {hit.isFullBreak ? (
                    <span className="text-red-600 dark:text-red-400 font-bold">
                      FB
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      {hit.barriersRemaining}
                    </span>
                  )}
                </td>
                <td
                  className={`${tdBase} text-right font-mono text-green-600 dark:text-green-300`}
                >
                  {fmt(hit.expectedDamage)}
                </td>
                <td className={`${tdBase} relative`}>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-500 flex flex-col leading-tight">
                      <span>自攻{atk > 0 ? `+${atk}` : atk}</span>
                      <span>敵防{eDefDisplay}</span>
                    </span>
                    <button
                      onClick={() =>
                        setOpenDetailIndex(
                          openDetailIndex === idx ? null : idx,
                        )
                      }
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      title="詳細を表示"
                    >
                      <span className="text-xs font-bold leading-none">
                        ...
                      </span>
                    </button>
                  </div>

                  {openDetailIndex === idx && (
                    <div className="absolute z-50 right-full top-0 mr-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 animate-in fade-in zoom-in duration-100">
                      <div className="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
                        <span className="font-semibold text-[11px] text-gray-600 dark:text-gray-300">
                          バフ詳細 (Hit {hit.sequenceIndex + 1})
                        </span>
                        <button
                          onClick={() => setOpenDetailIndex(null)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          ×
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-y-1 max-h-60 overflow-y-auto">
                        {hit.isFullBreakBefore && (
                          <div className="text-[10px] text-red-500 font-bold border-b border-red-100 dark:border-red-900/30 mb-1 pb-1">
                            フルブレイク適用中
                          </div>
                        )}
                        {!hit.isFullBreakBefore && hit.isFullBreak && (
                          <div className="text-[10px] text-orange-500 font-bold border-b border-orange-100 dark:border-orange-900/30 mb-1 pb-1">
                            このヒットでFB発生
                          </div>
                        )}
                        {Object.entries(hit.buffStateBefore)
                          .filter(([key, val]) => {
                            if (val === 0) return false;
                            // FB中は通常の防御デバフは計算に関係ないので非表示にする
                            if (hit.isFullBreakBefore) {
                              if (
                                [
                                  'enemyYangDefR1',
                                  'enemyYangDefR2',
                                  'enemyYinDefR1',
                                  'enemyYinDefR2',
                                ].includes(key)
                              ) {
                                return false;
                              }
                            }
                            return true;
                          })
                          .map(([key, val]) => (
                            <div
                              key={key}
                              className="flex justify-between text-[10px]"
                            >
                              <span className="text-gray-500 dark:text-gray-400">
                                {getBuffLabel(key)}
                              </span>
                              <span
                                className={`font-mono font-medium ${val > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}
                              >
                                {val > 0 ? `+${val}` : val}
                              </span>
                            </div>
                          ))}
                        {Object.values(hit.buffStateBefore).every(
                          (v) => v === 0,
                        ) && (
                          <div className="text-[10px] text-gray-400 italic">
                            変動なし
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </td>
                <td className={`${tdBase} text-cyan-600 dark:text-cyan-400`}>
                  {hit.buffChanges.length > 0 ? (
                    hit.buffChanges.map((c) => c.label).join(' / ')
                  ) : (
                    <span className="text-gray-300 dark:text-gray-700">—</span>
                  )}
                </td>
              </tr>
            );
          })}
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
              bulletStaticResults={result.bulletSimResults}
              bullets={bullets}
              totalDamage={result.totalSimDamage}
            />
          </div>
          <StaticTable result={result} bullets={bullets} />
        </>
      ) : (
        <>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <SimHitChart hitSequence={result.hitSequence} />
          </div>
          <SimulationTable result={result} bullets={bullets} />
        </>
      )}
    </div>
  );
}
