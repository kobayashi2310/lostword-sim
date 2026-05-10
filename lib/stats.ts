import type { DamageBonus, BarrierAilmentType, AbilityConfig } from '@/types';
import { getAtkDefSpdMultiplier, clampR1 } from './buffs';

/**
 * ステータスに対する一連の補正（蓄積・能力・Rank1/2バフ・異常デバフ）を適用した最終的な倍率を計算する
 */
export function calculateEffectiveStatMult(
  baseValue: number,
  r1: number,
  r2: number,
  ailmentCount: number,
  isNullified: boolean,
  abilityBonusStages: number,
  accumulationValue: number,
): { value: number; multiplier: number } {
  const effectiveBase = baseValue + accumulationValue;
  const combinedR1 = clampR1(r1 + abilityBonusStages);

  const ailmentMult = isNullified ? 1.0 : Math.pow(0.875, ailmentCount);
  const rankMult =
    getAtkDefSpdMultiplier(combinedR1) * getAtkDefSpdMultiplier(r2);

  const totalMult = rankMult * ailmentMult;
  return {
    value: effectiveBase * totalMult,
    multiplier: totalMult,
  };
}

/**
 * 指定したステータス種別(yangAttack等)に対する蓄積値の合計を取得
 */
export function getAccumulationSum(
  damageBonus: DamageBonus,
  targetStat: string,
): number {
  return (damageBonus.accumulationEffects || [])
    .filter((e) => e.targetStat === targetStat)
    .reduce((sum, e) => sum + Math.floor((e.sourceValue * e.rate) / 100), 0);
}

/**
 * 異常の無効化判定（能力・変換設定込み）
 */
export function isAilmentNullified(
  ability: AbilityConfig,
  ailmentType: BarrierAilmentType,
): boolean {
  return (
    ability.nullifyAilments.includes(ailmentType) ||
    ability.convertAilments.some((c) => c.ailment === ailmentType)
  );
}
