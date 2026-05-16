import type {
  Bullet,
  BuffStages,
  DamageBonus,
  ElementalAdvantage,
  EnemyStats,
  GreatBarrierEntry,
  GreatBarrierStatType,
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
import {
  calculateEffectiveStatMult,
  getAccumulationSum,
  isAilmentNullified,
} from './stats';

// ============================================================
// 大結界ヘルパー
// ============================================================

function calcGbSelfMult(entries: GreatBarrierEntry[], stat: GreatBarrierStatType): number {
  return entries
    .filter((e) => e.stat === stat)
    .reduce(
      (m, e) => m * (e.selfDir === 'UP' ? 1 + e.selfValue / 100 : 1 - e.selfValue / 100),
      1,
    );
}

// 物理防御系 (陽防/陰防) の敵側: DOWN → 敵防御 × (1 − n/100)
function calcGbEnemyDefMult(entries: GreatBarrierEntry[], stat: GreatBarrierStatType): number {
  return entries
    .filter((e) => e.stat === stat)
    .reduce(
      (m, e) => m * (e.selfDir === 'UP' ? 1 - e.enemyValue / 100 : 1 + e.enemyValue / 100),
      1,
    );
}

// CRI攻撃/CRI防御の敵側: 敵CRI防御DOWN → CRI時ダメ × (1 + n/100)
function calcGbCriEnemyMult(entries: GreatBarrierEntry[]): number {
  return entries
    .filter((e) => e.stat === 'CRI攻撃/CRI防御')
    .reduce(
      (m, e) => m * (e.selfDir === 'UP' ? 1 + e.enemyValue / 100 : 1 - e.enemyValue / 100),
      1,
    );
}

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
  const abilityBonus = getAbilityBuffBonus(selfAilments, selfStats.ability);

  // 1. 攻撃力
  const { value: attackPower } = calculateEffectiveStatMult(
    isYang ? selfStats.yangAttack : selfStats.yinAttack,
    isYang ? buffs.yangAttackR1 : buffs.yinAttackR1,
    isYang ? buffs.yangAttackR2 : buffs.yinAttackR2,
    isYang ? selfAilments.毒霧 : selfAilments.燃焼,
    isAilmentNullified(selfStats.ability, isYang ? '毒霧' : '燃焼'),
    abilityBonus['陽攻・陰攻・CRI攻撃・CRI命中'],
    getAccumulationSum(damageBonus, isYang ? 'yangAttack' : 'yinAttack'),
  );

  // 2. 速力 (斬裂弾用)
  const { value: speed } = calculateEffectiveStatMult(
    selfStats.speed,
    buffs.speedR1,
    buffs.speedR2,
    selfAilments.凍結,
    isAilmentNullified(selfStats.ability, '凍結'),
    abilityBonus['速力・命中・回避'],
    getAccumulationSum(damageBonus, 'speed'),
  );

  // 3. 自身防御 (硬質弾用)
  const { value: selfDefense } = calculateEffectiveStatMult(
    isYang ? selfStats.yangDefense : selfStats.yinDefense,
    isYang ? buffs.selfYangDefR1 : buffs.selfYinDefR1,
    isYang ? buffs.selfYangDefR2 : buffs.selfYinDefR2,
    isYang ? selfAilments.毒霧 : selfAilments.燃焼,
    isAilmentNullified(selfStats.ability, isYang ? '毒霧' : '燃焼'),
    abilityBonus['陽防・陰防・CRI防御・CRI回避'],
    getAccumulationSum(damageBonus, isYang ? 'yangDefense' : 'yinDefense'),
  );

  // 大結界補正 (別枠乗算)
  const gb = damageBonus.greatBarrier;
  const gbAtkMult = gb ? calcGbSelfMult(gb.entries, isYang ? '陽攻' : '陰攻') : 1;
  const gbSpdMult = gb ? calcGbSelfMult(gb.entries, '速力') : 1;
  const gbDefMult = gb ? calcGbSelfMult(gb.entries, isYang ? '陽防' : '陰防') : 1;

  // 共鳴補正 (速力のみ別枠乗算あり)
  const speedResonanceBonus = (damageBonus.resonanceEffects || [])
    .filter((e) => e.kind === '速力')
    .reduce((sum, e) => sum + e.value, 0);
  const effectiveSpeed = speed * gbSpdMult * (1 + speedResonanceBonus / 100);

  const slashComponent =
    bullet.slashPercent > 0 ? effectiveSpeed * (bullet.slashPercent / 100) : 0;

  const hardComponent =
    bullet.hardPercent > 0 ? selfDefense * gbDefMult * (bullet.hardPercent / 100) : 0;

  return attackPower * gbAtkMult + slashComponent + hardComponent;
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
  damageBonus?: DamageBonus | null,
): number {
  const isYang = bullet.yinYang === '陽気';
  const baseDef = isYang ? enemyStats.yangDefense : enemyStats.yinDefense;

  // 1. フルブレイク補正 (別枠乗算)
  const fbMult = isFullBreak ? getAtkDefSpdMultiplier(-10) : 1.0;

  // 2. Rankバフ・デバフ・異常補正
  let totalRankAilmentMult = 1.0;

  if (bullet.isPenetration) {
    // 貫通弾: Rank補正を無視し、異常デバフのみ適用
    const isNullified = isAilmentNullified(
      enemyStats.ability,
      isYang ? '毒霧' : '燃焼',
    );
    const ailmentCount = isYang ? enemyAilments.毒霧 : enemyAilments.燃焼;
    totalRankAilmentMult = isNullified ? 1.0 : Math.pow(0.875, ailmentCount);
  } else {
    // 通常弾: すべて適用
    const abilityBonus = getAbilityBuffBonus(enemyAilments, enemyStats.ability);
    const { multiplier } = calculateEffectiveStatMult(
      0, // ベース値は後で掛けるため0
      isYang ? buffs.enemyYangDefR1 : buffs.enemyYinDefR1,
      isYang ? buffs.enemyYangDefR2 : buffs.enemyYinDefR2,
      isYang ? enemyAilments.毒霧 : enemyAilments.燃焼,
      isAilmentNullified(enemyStats.ability, isYang ? '毒霧' : '燃焼'),
      abilityBonus['陽防・陰防・CRI防御・CRI回避'],
      0,
    );
    totalRankAilmentMult = isFullBreak ? 1.0 : multiplier;
  }

  // 3. 大結界補正 (別枠乗算・FB中も有効)
  const gb = damageBonus?.greatBarrier;
  const gbMult = gb ? calcGbEnemyDefMult(gb.entries, isYang ? '陽防' : '陰防') : 1;

  return baseDef * fbMult * totalRankAilmentMult * gbMult;
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
    damageBonus,
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

  // 大結界補正 (威力・CRI)
  const gb = damageBonus.greatBarrier;
  // 威力補正後は少数第3位以下切り捨て
  const effectivePower = gb
    ? Math.floor(bullet.power * calcGbSelfMult(gb.entries, '威力') * 100) / 100
    : bullet.power;
  const gbCriMult =
    isCrit && gb
      ? calcGbSelfMult(gb.entries, 'CRI攻撃/CRI防御') * calcGbCriEnemyMult(gb.entries)
      : 1;

  return Math.floor(
    effectivePower *
      (attackPower / enemyDefense) *
      baseFactor *
      0.4 *
      elementalMult *
      critMult *
      gbCriMult *
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
