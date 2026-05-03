import type {
  Bullet,
  BuffStages,
  DamageBonus,
  ElementalAdvantage,
  EnemyStats,
  SelfStats,
} from '@/types';
import {
  calcTotalChargeMult,
  combinedCriAttackR1,
  combinedCriHitR1,
} from '@/types';
import {
  getAtkDefSpdMultiplier,
  getCritMultiplier,
  getEffectiveCriRate,
  getEffectiveHitRate,
} from './buffs';

// ============================================================
// 属性相性倍率
// ============================================================

export function getElementalMultiplier(
  advantage: ElementalAdvantage,
  advantageBonus = 0, // 有利属性ダメージアップ %
  disadvantageBonus = 0, // 不利属性ダメージアップ %
): number {
  switch (advantage) {
    case '有利':
      return 2.0 * (1 + advantageBonus / 100);
    case '等倍':
      return 1.0;
    case '不利':
      return 0.5 * (1 + disadvantageBonus / 100);
  }
}

// ============================================================
// 攻撃力計算
// 陽気: 陽攻×陽攻バフ + 速力×速力バフ×斬裂% + 自身陽防×陽防バフ×硬質%
// 陰気: 陰攻×陰攻バフ + 速力×速力バフ×斬裂% + 自身陰防×陰防バフ×硬質%
// ============================================================

export function calcAttackPower(
  selfStats: SelfStats,
  buffs: BuffStages,
  bullet: Bullet,
): number {
  const isYang = bullet.yinYang === '陽気';

  const baseAtk = isYang ? selfStats.yangAttack : selfStats.yinAttack;
  const atkR1 = isYang ? buffs.yangAttackR1 : buffs.yinAttackR1;
  const atkR2 = isYang ? buffs.yangAttackR2 : buffs.yinAttackR2;
  const atkMult = getAtkDefSpdMultiplier(atkR1) * getAtkDefSpdMultiplier(atkR2);

  const speedMult =
    getAtkDefSpdMultiplier(buffs.speedR1) *
    getAtkDefSpdMultiplier(buffs.speedR2);

  const selfDef = isYang ? selfStats.yangDefense : selfStats.yinDefense;
  const selfDefR1 = isYang ? buffs.selfYangDefR1 : buffs.selfYinDefR1;
  const selfDefR2 = isYang ? buffs.selfYangDefR2 : buffs.selfYinDefR2;
  const selfDefMult =
    getAtkDefSpdMultiplier(selfDefR1) * getAtkDefSpdMultiplier(selfDefR2);

  const slashComponent =
    bullet.slashPercent > 0
      ? selfStats.speed * speedMult * (bullet.slashPercent / 100)
      : 0;

  const hardComponent =
    bullet.hardPercent > 0
      ? selfDef * selfDefMult * (bullet.hardPercent / 100)
      : 0;

  return baseAtk * atkMult + slashComponent + hardComponent;
}

// ============================================================
// 敵防御力計算（バフ込み）
// ============================================================

export function calcEnemyDefense(
  enemyStats: EnemyStats,
  buffs: BuffStages,
  bullet: Bullet,
): number {
  const isYang = bullet.yinYang === '陽気';
  const baseDef = isYang ? enemyStats.yangDefense : enemyStats.yinDefense;
  const defR1 = isYang ? buffs.enemyYangDefR1 : buffs.enemyYinDefR1;
  const defR2 = isYang ? buffs.enemyYangDefR2 : buffs.enemyYinDefR2;
  const defMult = getAtkDefSpdMultiplier(defR1) * getAtkDefSpdMultiplier(defR2);
  return baseDef * defMult;
}

// ============================================================
// バレット1発のダメージ（切り捨て）
// ダメージ = 威力 × (攻撃力 / 防御力) × 基本係数 × 0.4 × 属性相性 × クリティカル補正 × (1 + Be + Bk)
// Be = 属性ダメージアップ率、Bk = 弾種ダメージアップ率（加算）
// ============================================================

export function calcSingleHitDamage(
  bullet: Bullet,
  selfStats: SelfStats,
  enemyStats: EnemyStats,
  buffs: BuffStages,
  isGirlReincarnation: boolean,
  advantage: ElementalAdvantage,
  isCrit: boolean,
  damageBonus: DamageBonus = {
    elementBonus: {},
    bulletKindBonus: {},
    advantageBonus: 0,
    disadvantageBonus: 0,
    chargeEffects: [],
  },
): number {
  const attackPower = calcAttackPower(selfStats, buffs, bullet);
  const enemyDefense = calcEnemyDefense(enemyStats, buffs, bullet);

  if (enemyDefense <= 0) return 0;

  const baseFactor = isGirlReincarnation ? 140 : 100;
  // 有利/不利補正を反映した属性相性倍率
  const elementalMult = getElementalMultiplier(
    advantage,
    damageBonus.advantageBonus,
    damageBonus.disadvantageBonus,
  );
  const critMult = isCrit
    ? getCritMultiplier(combinedCriAttackR1(buffs), buffs.selfCriAttackR2)
    : 1;
  // 属性・弾種ダメージアップ（加算方式）
  const bonusMult =
    1 +
    (damageBonus.elementBonus[bullet.element] ?? 0) / 100 +
    (damageBonus.bulletKindBonus[bullet.bulletKind] ?? 0) / 100;
  // 蓄力（加算合計後に乗算、floor内に含める）
  const chargeMult = 1 + calcTotalChargeMult(damageBonus.chargeEffects ?? []);

  return Math.floor(
    bullet.power *
      (attackPower / enemyDefense) *
      baseFactor *
      0.4 *
      elementalMult *
      critMult *
      bonusMult *
      chargeMult,
  );
}

// ============================================================
// 期待値ダメージ計算（1発分、切り捨て処理付き）
// 手順: 非CRIとCRIを切り捨て → CRI確率で合算 → 命中率で切り捨て
// ============================================================

export function calcExpectedSingleHitDamage(
  bullet: Bullet,
  selfStats: SelfStats,
  enemyStats: EnemyStats,
  buffs: BuffStages,
  isGirlReincarnation: boolean,
  advantage: ElementalAdvantage,
  mustHit: boolean,
  specialAttack: boolean,
  damageBonus: DamageBonus = {
    elementBonus: {},
    bulletKindBonus: {},
    advantageBonus: 0,
    disadvantageBonus: 0,
    chargeEffects: [],
  },
): number {
  const nonCritDmg = calcSingleHitDamage(
    bullet,
    selfStats,
    enemyStats,
    buffs,
    isGirlReincarnation,
    advantage,
    false,
    damageBonus,
  );
  const critDmg = calcSingleHitDamage(
    bullet,
    selfStats,
    enemyStats,
    buffs,
    isGirlReincarnation,
    advantage,
    true,
    damageBonus,
  );

  const criRatePct = getEffectiveCriRate(
    bullet.criRate,
    combinedCriHitR1(buffs),
    buffs.selfCriHitR2,
    specialAttack,
  );
  const criRate = criRatePct / 100;
  const hitRatePct = getEffectiveHitRate(
    bullet.hitRate,
    buffs.hitRateR1,
    buffs.hitRateR2,
    mustHit,
  );
  const hitRate = hitRatePct / 100;

  // 非CRI × (1-CRI率) + CRI × CRI率 → 命中率で切り捨て
  const combined = nonCritDmg * (1 - criRate) + critDmg * criRate;
  return Math.floor(combined * hitRate);
}

// ============================================================
// 段ごとの期待値合計ダメージ（弾数分合算）
// ============================================================

export function calcStageTotalExpected(
  bullet: Bullet,
  selfStats: SelfStats,
  enemyStats: EnemyStats,
  buffs: BuffStages,
  isGirlReincarnation: boolean,
  advantage: ElementalAdvantage,
  mustHit: boolean,
  specialAttack: boolean,
  damageBonus: DamageBonus = {
    elementBonus: {},
    bulletKindBonus: {},
    advantageBonus: 0,
    disadvantageBonus: 0,
    chargeEffects: [],
  },
): number {
  const expectedSingle = calcExpectedSingleHitDamage(
    bullet,
    selfStats,
    enemyStats,
    buffs,
    isGirlReincarnation,
    advantage,
    mustHit,
    specialAttack,
    damageBonus,
  );
  return expectedSingle * bullet.count;
}
