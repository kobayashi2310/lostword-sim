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
  combinedCriAttackR2,
  combinedCriHitR1,
  combinedCriHitR2,
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
  damageBonus: DamageBonus = {
    elementBonus: {},
    bulletKindBonus: {},
    advantageBonus: 0,
    disadvantageBonus: 0,
    chargeEffects: [],
    accumulationEffects: [],
    resonanceEffects: [],
  },
): number {
  const isYang = bullet.yinYang === '陽気';

  // 蓄積値の集計
  const getAcc = (target: string) =>
    (damageBonus.accumulationEffects || [])
      .filter((e) => e.targetStat === target)
      .reduce((sum, e) => sum + Math.floor((e.sourceValue * e.rate) / 100), 0);

  // 能力によるバフボーナスを計算
  const abilityBonus = getAbilityBuffBonus(selfAilments, selfStats.ability);

  // ステータス倍率の計算 (基礎値 + 蓄積) * バフ
  const rawAtk = isYang ? selfStats.yangAttack : selfStats.yinAttack;
  const baseAtk = rawAtk + getAcc(isYang ? 'yangAttack' : 'yinAttack');

  const atkR1 = isYang ? buffs.yangAttackR1 : buffs.yinAttackR1;
  const atkR2 = isYang ? buffs.yangAttackR2 : buffs.yinAttackR2;
  const combinedAtkR1 = clampR1(
    atkR1 + abilityBonus['陽攻・陰攻・CRI攻撃・CRI命中'],
  );

  // 結界異常デバフ (燃焼は陰攻、毒霧は陽攻)
  const isPoisonNullified =
    selfStats.ability.nullifyAilments.includes('毒霧') ||
    selfStats.ability.convertAilments.some((c) => c.ailment === '毒霧');
  const isBurnNullified =
    selfStats.ability.nullifyAilments.includes('燃焼') ||
    selfStats.ability.convertAilments.some((c) => c.ailment === '燃焼');

  const atkAilmentMult = isYang
    ? isPoisonNullified
      ? 1.0
      : Math.pow(0.875, selfAilments.毒霧)
    : isBurnNullified
      ? 1.0
      : Math.pow(0.875, selfAilments.燃焼);

  const atkMult =
    getAtkDefSpdMultiplier(combinedAtkR1) *
    getAtkDefSpdMultiplier(atkR2) *
    atkAilmentMult;

  // 速力 (基礎値 + 蓄積) * バフ
  const baseSpeed = selfStats.speed + getAcc('speed');
  const combinedSpeedR1 = clampR1(
    buffs.speedR1 + abilityBonus['速力・命中・回避'],
  );
  const isFreezeNullified =
    selfStats.ability.nullifyAilments.includes('凍結') ||
    selfStats.ability.convertAilments.some((c) => c.ailment === '凍結');

  const speedAilmentMult = isFreezeNullified
    ? 1.0
    : Math.pow(0.875, selfAilments.凍結);
  const speedMult =
    getAtkDefSpdMultiplier(combinedSpeedR1) *
    getAtkDefSpdMultiplier(buffs.speedR2) *
    speedAilmentMult;

  // 防御補正 (斬裂弾の後に使うため、ここで計算)
  // 共鳴補正 (速力)
  const speedResonanceBonus = (damageBonus.resonanceEffects || [])
    .filter((e) => e.kind === '速力')
    .reduce((sum, e) => sum + e.value, 0);
  const speedResonanceMult = 1 + speedResonanceBonus / 100;

  // 自身防御 (基礎値 + 蓄積) * バフ
  const rawDef = isYang ? selfStats.yangDefense : selfStats.yinDefense;
  const baseSelfDef = rawDef + getAcc(isYang ? 'yangDefense' : 'yinDefense');

  const selfDefR1 = isYang ? buffs.selfYangDefR1 : buffs.selfYinDefR1;
  const selfDefR2 = isYang ? buffs.selfYangDefR2 : buffs.selfYinDefR2;
  const combinedSelfDefR1 = clampR1(
    selfDefR1 + abilityBonus['陽防・陰防・CRI防御・CRI回避'],
  );

  const selfDefAilmentMult = isYang
    ? isPoisonNullified
      ? 1.0
      : Math.pow(0.875, selfAilments.毒霧)
    : isBurnNullified
      ? 1.0
      : Math.pow(0.875, selfAilments.燃焼);

  const selfDefMult =
    getAtkDefSpdMultiplier(combinedSelfDefR1) *
    getAtkDefSpdMultiplier(selfDefR2) *
    selfDefAilmentMult;

  const slashComponent =
    bullet.slashPercent > 0
      ? baseSpeed * speedMult * speedResonanceMult * (bullet.slashPercent / 100)
      : 0;

  const hardComponent =
    bullet.hardPercent > 0
      ? baseSelfDef * selfDefMult * (bullet.hardPercent / 100)
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

  // 1. フルブレイク補正 (別枠乗算)
  // フルブレイク時は防御デバフ10段階相当(1/4)の補正がかかる
  const fbMult = isFullBreak ? getAtkDefSpdMultiplier(-10) : 1.0;

  // 2. Rankバフ・デバフ補正 (貫通弾はここを無視)
  let rankMult = 1.0;
  if (!bullet.isPenetration) {
    if (isFullBreak) {
      // フルブレイク中はRankバフ/デバフがリセットされているため1.0固定
      // (CRI防御等の特殊なものは別関数で処理)
      rankMult = 1.0;
    } else {
      // 通常時はRank1/Rank2バフ、および敵の能力バフを適用
      const abilityBonus = getAbilityBuffBonus(
        enemyAilments,
        enemyStats.ability,
      );
      const defR1 = isYang ? buffs.enemyYangDefR1 : buffs.enemyYinDefR1;
      const defR2 = isYang ? buffs.enemyYangDefR2 : buffs.enemyYinDefR2;
      const combinedDefR1 = clampR1(
        defR1 + abilityBonus['陽防・陰防・CRI防御・CRI回避'],
      );
      rankMult =
        getAtkDefSpdMultiplier(combinedDefR1) * getAtkDefSpdMultiplier(defR2);
    }
  }

  // 3. 結界異常デバフ (燃焼は陰防、毒霧は陽防)
  // 貫通弾でも恩恵を受けることができる
  const isPoisonNullified =
    enemyStats.ability.nullifyAilments.includes('毒霧') ||
    enemyStats.ability.convertAilments.some((c) => c.ailment === '毒霧');
  const isBurnNullified =
    enemyStats.ability.nullifyAilments.includes('燃焼') ||
    enemyStats.ability.convertAilments.some((c) => c.ailment === '燃焼');

  const ailmentMult = isYang
    ? isPoisonNullified
      ? 1.0
      : Math.pow(0.875, enemyAilments.毒霧)
    : isBurnNullified
      ? 1.0
      : Math.pow(0.875, enemyAilments.燃焼);

  // 最終的な防御力 = 基礎 × フルブレイク補正 × Rank補正 × 異常デバフ
  return baseDef * fbMult * rankMult * ailmentMult;
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
    accumulationEffects: [],
    resonanceEffects: [],
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
  const attackPower = calcAttackPower(
    selfStats,
    buffs,
    bullet,
    selfAilments,
    damageBonus,
  );
  const enemyDefense = calcEnemyDefense(
    enemyStats,
    buffs,
    bullet,
    enemyAilments,
    isFullBreak,
  );

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
  const criAttackR2 = combinedCriAttackR2(buffs);
  const combinedCriAttackR1Val = clampR1(
    criAttackR1 + abilityBonus['陽攻・陰攻・CRI攻撃・CRI命中'],
  );

  const critMult = isCrit
    ? getCritMultiplier(combinedCriAttackR1Val, criAttackR2)
    : 1;

  const bonusMult =
    1 +
    (damageBonus.elementBonus[bullet.element] ?? 0) / 100 +
    (damageBonus.bulletKindBonus[bullet.bulletKind] ?? 0) / 100;

  const chargeMult = 1 + calcTotalChargeMult(damageBonus.chargeEffects || []);

  // 共鳴補正 (ダメージアップ / CRI時ダメージアップ)
  const resDamageBonus = (damageBonus.resonanceEffects || [])
    .filter((e) => e.kind === 'ダメージアップ')
    .reduce((sum, e) => sum + e.value, 0);
  const resCriDamageBonus = isCrit
    ? (damageBonus.resonanceEffects || [])
        .filter((e) => e.kind === 'CRI時ダメージアップ')
        .reduce((sum, e) => sum + e.value, 0)
    : 0;

  const resonanceMult =
    (1 + resDamageBonus / 100) * (1 + resCriDamageBonus / 100);

  return Math.floor(
    bullet.power *
      (attackPower / enemyDefense) *
      baseFactor *
      0.4 *
      elementalMult *
      critMult *
      bonusMult *
      chargeMult *
      resonanceMult,
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
    accumulationEffects: [],
    resonanceEffects: [],
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
  const combinedCriHitR1Val = clampR1(
    criHitR1 + abilityBonus['陽攻・陰攻・CRI攻撃・CRI命中'],
  );

  // 共鳴補正 (攻撃時CRI率)
  const resCriRateBonus = (damageBonus.resonanceEffects || [])
    .filter((e) => e.kind === '攻撃時CRI率')
    .reduce((sum, e) => sum + e.value, 0);

  const criRatePct = getEffectiveCriRate(
    bullet.criRate,
    combinedCriHitR1Val,
    combinedCriHitR2(buffs),
    specialAttack,
    resCriRateBonus,
  );
  const criRate = criRatePct / 100;

  // 命中
  const hitRateR1 = combinedHitRateR1(buffs);
  const combinedHitRateR1Val = clampR1(
    hitRateR1 + abilityBonus['速力・命中・回避'],
  );

  // 暗闇(自)・帯電(敵) の無効化判定
  const isBlindNullified =
    selfStats.ability.nullifyAilments.includes('暗闇') ||
    selfStats.ability.convertAilments.some((c) => c.ailment === '暗闇');
  const isParalyzeNullified =
    enemyStats.ability.nullifyAilments.includes('帯電') ||
    enemyStats.ability.convertAilments.some((c) => c.ailment === '帯電');

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
    accumulationEffects: [],
    resonanceEffects: [],
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
