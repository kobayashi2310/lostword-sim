'use client';

import type {
  BarrierAilmentType,
  BarrierStatus,
  BulletEffect,
  EffectBreak,
  BreakEffectType,
} from '@/types';

/** ブレイク対象の異常型を取得 */
export function getBreakTargetAilment(
  effects: BulletEffect[],
): BarrierAilmentType | null {
  const breakEffect = effects.find((e) => e.kind === 'ブレイク') as
    | EffectBreak
    | undefined;
  if (!breakEffect) return null;
  const mapping: Record<BreakEffectType, BarrierAilmentType> = {
    過毒: '毒霧',
    焼却: '燃焼',
    氷解: '凍結',
    放電: '帯電',
    閃光: '暗闇',
  };
  return mapping[breakEffect.breakType];
}

/**
 * 結界配列に異常を付与する。
 * 「1から付与。1が埋まっている場合は後ろへずらす。すべて埋まっている場合は付与不可」
 */
export function inflictAilment(
  barriers: BarrierStatus[],
  ailmentType: BarrierAilmentType,
): BarrierStatus[] {
  const existingAilments = barriers
    .map((b) => b.ailment)
    .filter((a): a is BarrierAilmentType => a !== null);

  if (existingAilments.length >= barriers.length) {
    return barriers;
  }

  const nextAilments = [ailmentType, ...existingAilments];

  return barriers.map((_, i) => ({
    ailment: i < nextAilments.length ? nextAilments[i] : null,
  }));
}

/**
 * ブレイク処理（特殊弾）
 */
export function processSpecialBreak(
  barriers: BarrierStatus[],
  targetAilment: BarrierAilmentType,
): { nextBarriers: BarrierStatus[]; brokenCount: number } {
  const nextBarriers = barriers.filter((b) => b.ailment !== targetAilment);
  const brokenCount = barriers.length - nextBarriers.length;
  return { nextBarriers, brokenCount };
}

/**
 * ブレイク処理（属性有利）
 */
export function processElementalBreak(barriers: BarrierStatus[]): {
  nextBarriers: BarrierStatus[];
  brokenCount: number;
} {
  if (barriers.length === 0) return { nextBarriers: barriers, brokenCount: 0 };
  return { nextBarriers: barriers.slice(1), brokenCount: 1 };
}
