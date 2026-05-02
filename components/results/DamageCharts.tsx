'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Bullet, BulletStaticResult, SingleHitResult } from '@/types';

// ============================================================
// 色定義（モジュールレベル定数 — レンダリングで再生成しない）
// ============================================================

const ELEMENT_COLORS: Record<string, string> = {
  星: '#fbbf24',
  火: '#f87171',
  水: '#60a5fa',
  木: '#4ade80',
  金: '#fcd34d',
  土: '#fb923c',
  日: '#fdba74',
  月: '#c084fc',
  無: '#9ca3af',
};

const BULLET_ID_COLORS: Record<number, string> = {
  1: '#f87171',
  2: '#fb923c',
  3: '#4ade80',
  4: '#60a5fa',
  5: '#c084fc',
  6: '#f472b6',
};

function getBulletColor(id: number): string {
  return BULLET_ID_COLORS[id] ?? '#9ca3af';
}

function fmtNum(v: number): string {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}万`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

// スタイル定数
const CHART_MARGIN = { top: 16, right: 10, left: 10, bottom: 5 };
const LEGEND_STYLE = { fontSize: '11px', color: '#9ca3af' };
const AXIS_TICK = { fontSize: 11, fill: '#9ca3af' };
const YAXIS_TICK = { fontSize: 10, fill: '#9ca3af' };
const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '6px',
  fontSize: '12px',
};

// ============================================================
// バレット別棒グラフ
// ============================================================

interface BulletChartProps {
  bulletStaticResults: BulletStaticResult[];
  bullets: Bullet[];
  totalDamage: number;
}

export function BulletDamageChart({
  bulletStaticResults,
  bullets,
  totalDamage,
}: BulletChartProps) {
  const data = useMemo(
    () =>
      bulletStaticResults.map((br) => {
        const bullet = bullets.find((b) => b.id === br.bulletId);
        const pct =
          totalDamage > 0
            ? ((br.expectedDamage / totalDamage) * 100).toFixed(1)
            : '0';
        return {
          name: `${br.bulletId}`,
          displayLabel: `バレット${br.bulletId} (${bullet?.element ?? ''})`,
          期待値: br.expectedDamage,
          pct,
          element: bullet?.element ?? '無',
        };
      }),
    [bulletStaticResults, bullets, totalDamage],
  );

  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        各段の期待値ダメージ（属性色）
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="name"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
          />
          <YAxis
            tickFormatter={fmtNum}
            tick={YAXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: '#d1d5db' }}
            itemStyle={{ color: '#d1d5db' }}
          />
          <Bar dataKey="期待値" name="期待値ダメージ" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={ELEMENT_COLORS[entry.element] ?? '#9ca3af'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-2 mt-1 flex-wrap">
        {data.map((d) => (
          <span
            key={d.name}
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            <span style={{ color: ELEMENT_COLORS[d.element] ?? '#9ca3af' }}>
              ●
            </span>
            {d.displayLabel}: {d.pct}%
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ヒット順棒グラフ
// ============================================================

interface SimChartProps {
  hitSequence: SingleHitResult[];
}

export function SimHitChart({ hitSequence }: SimChartProps) {
  const data = useMemo(
    () =>
      hitSequence.map((hit) => ({
        name: `${hit.sequenceIndex + 1}`,
        ダメージ: hit.expectedDamage,
        bulletId: hit.bulletId,
      })),
    [hitSequence],
  );

  const bulletIds = useMemo(
    () => [...new Set(data.map((d) => d.bulletId))].sort((a, b) => a - b),
    [data],
  );

  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        ヒット順の CRI ダメージ（色 = バレット段）
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={CHART_MARGIN} barCategoryGap="10%">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
            interval={Math.max(0, Math.floor(data.length / 10) - 1)}
          />
          <YAxis
            tickFormatter={fmtNum}
            tick={YAXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: '#d1d5db' }}
            itemStyle={{ color: '#d1d5db' }}
          />
          <Bar dataKey="ダメージ" name="CRIダメージ" radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getBulletColor(entry.bulletId)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-3 mt-1 flex-wrap">
        {bulletIds.map((id) => (
          <span
            key={id}
            className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"
          >
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: getBulletColor(id) }}
            />
            バレット{id}
          </span>
        ))}
      </div>
    </div>
  );
}
