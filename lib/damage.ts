import type {
  Bullet,
  BuffStages,
  DamageBonus,
  ElementalAdvantage,
  EnemyStats,
  SelfStats,
  BarrierAilmentType,
} from '@/types';
import {
  calcTotalChargeMult,
  combinedCriAttackR1,
  combinedCriHitR1,
  combinedHitRateR1,
  combinedHitRateR2,
} from '@/types';
import {
  getAtkDefSpdMultiplier,
  getCritMultiplier,
  getEffectiveCriRate,
  getEffectiveHitRate,
  getAbilityBuffBonus,
  clampR1,
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
// ============================================================

export function calcAttackPower(
  selfStats: SelfStats,
  buffs: BuffStages,
  bullet: Bullet,
  selfAilments: Record<BarrierAilmentType, number> = {
    燃焼: 0,
    凍結: 0,
    帯電: 0,
    毒霧: 0,
    暗闇: 0,
  },
): number {
  const isYang = bullet.yinYang === '陽気';
  
  // 能力によるバフボーナスを計算
  const abilityBonus = getAbilityBuffBonus(selfAilments, selfStats.ability);

  // ステータス倍率の計算 (能力ボーナスをRank1に加算)
  const baseAtk = isYang ? selfStats.yangAttack : selfStats.yinAttack;
  const atkR1 = isYang ? buffs.yangAttackR1 : buffs.yinAttackR1;
  const atkR2 = isYang ? buffs.yangAttackR2 : buffs.yinAttackR2;
  const combinedAtkR1 = clampR1(atkR1 + abilityBonus['陽攻・陰攻・CRI攻撃・CRI命中']);
  
  // 結界異常デバフ (燃焼は陰攻、毒霧は陽攻)
  // 能力で「バフに変換」または「無効化」している場合はこのデバフ（0.875倍）を受けない
  const isPoisonNullified = selfStats.ability.nullifyAilments.includes('毒霧') || 
    selfStats.ability.convertAilments.some(c => c.ailment === '毒霧');
  const isBurnNullified = selfStats.ability.nullifyAilments.includes('燃焼') ||
    selfStats.ability.convertAilments.some(c => c.ailment === '燃焼');

  const atkAilmentMult = isYang 
    ? (isPoisonNullified ? 1.0 : Math.pow(0.875, selfAilments.毒霧))
    : (isBurnNullified ? 1.0 : Math.pow(0.875, selfAilments.燃焼));

  const atkMult = getAtkDefSpdMultiplier(combinedAtkR1) * getAtkDefSpdMultiplier(atkR2) * atkAilmentMult;

  // 速力
  const combinedSpeedR1 = clampR1(buffs.speedR1 + abilityBonus['速力・命中・回避']);
  const isFreezeNullified = selfStats.ability.nullifyAilments.includes('凍結') ||
    selfStats.ability.convertAilments.some(c => c.ailment === '凍結');
  
  const speedAilmentMult = isFreezeNullified ? 1.0 : Math.pow(0.875, selfAilments.凍結);
  const speedMult =
    getAtkDefSpdMultiplier(combinedSpeedR1) *
    getAtkDefSpdMultiplier(buffs.speedR2) *
    speedAilmentMult;

  // 自身防御 (硬質弾用)
  const selfDef = isYang ? selfStats.yangDefense : selfStats.yinDefense;
  const selfDefR1 = isYang ? buffs.selfYangDefR1 : buffs.selfYinDefR1;
  const selfDefR2 = isYang ? buffs.selfYangDefR2 : buffs.selfYinDefR2;
  const combinedSelfDefR1 = clampR1(selfDefR1 + abilityBonus['陽防・陰防・CRI防御・CRI回避']);
  
  // 防御への異常デバフ (燃焼は陰防、毒霧は陽防)
  const selfDefAilmentMult = isYang
    ? (isPoisonNullified ? 1.0 : Math.pow(0.875, selfAilments.毒霧))
    : (isBurnNullified ? 1.0 : Math.pow(0.875, selfAilments.燃焼));

  const selfDefMult =
    getAtkDefSpdMultiplier(combinedSelfDefR1) * getAtkDefSpdMultiplier(selfDefR2) * selfDefAilmentMult;

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
// 敵防御力計算（バフ・結界異常込み）
// ============================================================

export function calcEnemyDefense(
  enemyStats: EnemyStats,
  buffs: BuffStages,
  bullet: Bullet,
  enemyAilments: Record<BarrierAilmentType, number> = {
    燃焼: 0,
    凍結: 0,
    帯電: 0,
    毒霧: 0,
    暗闇: 0,
  },
  isFullBreak: boolean = false,
): number {
  const isYang = bullet.yinYang === '陽気';
  const baseDef = isYang ? enemyStats.yangDefense : enemyStats.yinDefense;
  
  // 敵の能力によるバフボーナスを計算
  const abilityBonus = getAbilityBuffBonus(enemyAilments, enemyStats.ability);

  let defMult = 1.0;

  if (bullet.isPenetration) {
    // 貫通弾は防御バフ・デバフ（フルブレイクの-10段階も含む）を一切無視
    defMult = 1.0;
  } else if (isFullBreak) {
    // フルブレイク時は防御デバフ10段階固定（能力バフは乗らない）
    defMult = getAtkDefSpdMultiplier(-10);
  } else {
    // 通常はRank1/Rank2バフを適用。さらに敵の能力バフを加算
    const defR1 = isYang ? buffs.enemyYangDefR1 : buffs.enemyYinDefR1;
    const defR2 = isYang ? buffs.enemyYangDefR2 : buffs.enemyYinDefR2;
    const combinedDefR1 = clampR1(defR1 + abilityBonus['陽防・陰防・CRI防御・CRI回避']);
    defMult = getAtkDefSpdMultiplier(combinedDefR1) * getAtkDefSpdMultiplier(defR2);
  }

  // 結界異常デバフ (燃焼は陰防、毒霧は陽防)
  // 能力で「バフに変換」または「無効化」している場合はこのデバフ（0.875倍）を受けない
  const isPoisonNullified = enemyStats.ability.nullifyAilments.includes('毒霧') || 
    enemyStats.ability.convertAilments.some(c => c.ailment === '毒霧');
  const isBurnNullified = enemyStats.ability.nullifyAilments.includes('燃焼') ||
    enemyStats.ability.convertAilments.some(c => c.ailment === '燃焼');

  const ailmentMult = isYang
    ? (isPoisonNullified ? 1.0 : Math.pow(0.875, enemyAilments.毒霧))
    : (isBurnNullified ? 1.0 : Math.pow(0.875, enemyAilments.燃焼));

  return baseDef * defMult * ailmentMult;
}

// ============================================================
// バレット1発のダメージ
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
  isFullBreak: boolean = false,
  enemyAilments: Record<BarrierAilmentType, number> = {
    燃焼: 0,
    凍結: 0,
    帯電: 0,
    毒霧: 0,
    暗闇: 0,
  },
  selfAilments: Record<BarrierAilmentType, number> = {
    燃焼: 0,
    凍結: 0,
    帯電: 0,
    毒霧: 0,
    暗闇: 0,
  },
): number {
  const attackPower = calcAttackPower(selfStats, buffs, bullet, selfAilments);
  const enemyDefense = calcEnemyDefense(enemyStats, buffs, bullet, enemyAilments, isFullBreak);

  if (enemyDefense <= 0) return 0;

  const baseFactor = isGirlReincarnation ? 140 : 100;
  const elementalMult = getElementalMultiplier(
    advantage,
    damageBonus.advantageBonus,
    damageBonus.disadvantageBonus,
  );

  // CRI攻撃バフへの能力ボーナス
  const abilityBonus = getAbilityBuffBonus(selfAilments, selfStats.ability);
  const criAttackR1 = combinedCriAttackR1(buffs);
  const combinedCriAttackR1Val = clampR1(criAttackR1 + abilityBonus['陽攻・陰攻・CRI攻撃・CRI命中']);

  const critMult = isCrit
    ? getCritMultiplier(combinedCriAttackR1Val, buffs.selfCriAttackR2)
    : 1;

  const bonusMult =
    1 +
    (damageBonus.elementBonus[bullet.element] ?? 0) / 100 +
    (damageBonus.bulletKindBonus[bullet.bulletKind] ?? 0) / 100;
  
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
// 期待値ダメージ計算（1発分）
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
  isFullBreak: boolean = false,
  enemyAilments: Record<BarrierAilmentType, number> = {
    燃焼: 0,
    凍結: 0,
    帯電: 0,
    毒霧: 0,
    暗闇: 0,
  },
  selfAilments: Record<BarrierAilmentType, number> = {
    燃焼: 0,
    凍結: 0,
    帯電: 0,
    毒霧: 0,
    暗闇: 0,
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
    isFullBreak,
    enemyAilments,
    selfAilments,
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
    isFullBreak,
    enemyAilments,
    selfAilments,
  );

  // CRI命中
  const abilityBonus = getAbilityBuffBonus(selfAilments, selfStats.ability);
  const criHitR1 = combinedCriHitR1(buffs);
  const combinedCriHitR1Val = clampR1(criHitR1 + abilityBonus['陽攻・陰攻・CRI攻撃・CRI命中']);

  const criRatePct = getEffectiveCriRate(
    bullet.criRate,
    combinedCriHitR1Val,
    buffs.selfCriHitR2,
    specialAttack,
  );
  const criRate = criRatePct / 100;

  // 命中
  const hitRateR1 = combinedHitRateR1(buffs);
  const combinedHitRateR1Val = clampR1(hitRateR1 + abilityBonus['速力・命中・回避']);
  
  // 暗闇(自)・帯電(敵) の無効化判定
  const isBlindNullified = selfStats.ability.nullifyAilments.includes('暗闇') ||
    selfStats.ability.convertAilments.some(c => c.ailment === '暗闇');
  const isParalyzeNullified = enemyStats.ability.nullifyAilments.includes('帯電') ||
    enemyStats.ability.convertAilments.some(c => c.ailment === '帯電');

  const hitRatePct = getEffectiveHitRate(
    bullet.hitRate,
    combinedHitRateR1Val,
    combinedHitRateR2(buffs),
    mustHit,
    isParalyzeNullified ? 0 : enemyAilments.帯電,
    isBlindNullified ? 0 : selfAilments.暗闇,
  );
  const hitRate = hitRatePct / 100;

  const combined = nonCritDmg * (1 - criRate) + critDmg * criRate;
  return Math.floor(combined * hitRate);
}

// ============================================================
// 段ごとの期待値合計ダメージ
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
  isFullBreak: boolean = false,
  enemyAilments: Record<BarrierAilmentType, number> = {
    燃焼: 0,
    凍結: 0,
    帯電: 0,
    毒霧: 0,
    暗闇: 0,
  },
  selfAilments: Record<BarrierAilmentType, number> = {
    燃焼: 0,
    凍結: 0,
    帯電: 0,
    毒霧: 0,
    暗闇: 0,
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
    isFullBreak,
    enemyAilments,
    selfAilments,
  );
  return expectedSingle * bullet.count;
}
