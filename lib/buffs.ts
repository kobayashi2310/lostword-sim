import type { BuffStages } from '@/types';

// ============================================================
// バフ倍率計算
// ============================================================

/**
 * 攻撃・防御・速力系バフの倍率計算
 * +n段階: ×(1 + 0.3×n)
 * -n段階: ÷(1 + 0.3×n) = ×(1 / (1 + 0.3×n))
 */
export function getAtkDefSpdMultiplier(stages: number): number {
  if (stages === 0) return 1;
  const base = 1 + 0.3 * Math.abs(stages);
  return stages > 0 ? base : 1 / base;
}

/**
 * 命中・CRI命中系バフの倍率計算（0〜+10のみ）
 * +n段階: ×(1 + 0.2×n)
 */
export function getHitCriHitMultiplier(stages: number): number {
  return 1 + 0.2 * Math.max(0, stages);
}

/**
 * CRIダメージ倍率計算
 * 無補正時: +100% → ×2.0
 * CRIダメージ増加率 = 100% × (1 + 0.3×R1) × (1 + 0.3×R2)
 * クリティカル補正 = 1 + CRIダメージ増加率
 */
export function getCritMultiplier(
  criAttackR1: number,
  criAttackR2: number,
): number {
  const r1 = Math.max(0, criAttackR1);
  const r2 = Math.max(0, criAttackR2);
  const criDamageRate = 1.0 * (1 + 0.3 * r1) * (1 + 0.3 * r2);
  return 1 + criDamageRate;
}

/**
 * 実効命中率を計算（0〜100 %）
 * 必中の場合は100%
 */
export function getEffectiveHitRate(
  baseHitRate: number,
  hitRateR1: number,
  hitRateR2: number,
  mustHit: boolean,
): number {
  if (mustHit) return 100;
  const mult =
    getHitCriHitMultiplier(hitRateR1) * getHitCriHitMultiplier(hitRateR2);
  return Math.min(baseHitRate * mult, 100);
}

/**
 * 実効CRI命中率を計算（0〜100 %）
 * 特効の場合は100%
 */
export function getEffectiveCriRate(
  baseCriRate: number,
  criHitR1: number,
  criHitR2: number,
  specialAttack: boolean,
): number {
  if (specialAttack) return 100;
  const mult =
    getHitCriHitMultiplier(criHitR1) * getHitCriHitMultiplier(criHitR2);
  return Math.min(baseCriRate * mult, 100);
}

// ============================================================
// バフ段階のクランプ
// ============================================================

export function clampR1(value: number): number {
  return Math.max(-10, Math.min(10, Math.round(value)));
}

export function clampR2(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value)));
}

export function clampHitCriR1(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value)));
}

// ============================================================
// バフ段階への追加効果適用
// ============================================================

/**
 * 自身バフ追加効果をバフ段階に反映する。
 * Rank1の各バフに対応するフィールドに加算し、上限でクランプする。
 */
export function applySelfBuff(
  buffs: BuffStages,
  buffType: string,
  stages: number,
): BuffStages {
  const next = { ...buffs };
  switch (buffType) {
    case '自身陽攻上昇':
      next.yangAttackR1 = clampR1(next.yangAttackR1 + stages);
      break;
    case '自身陰攻上昇':
      next.yinAttackR1 = clampR1(next.yinAttackR1 + stages);
      break;
    case '自身速力上昇':
      next.speedR1 = clampHitCriR1(next.speedR1 + stages);
      break;
    case '自身陽防上昇':
      next.selfYangDefR1 = clampR1(next.selfYangDefR1 + stages);
      break;
    case '自身陰防上昇':
      next.selfYinDefR1 = clampR1(next.selfYinDefR1 + stages);
      break;
    case '自身命中上昇':
      next.hitRateR1 = clampHitCriR1(next.hitRateR1 + stages);
      break;
    case '自身CRI命中上昇':
      next.selfCriHitR1 = clampHitCriR1(next.selfCriHitR1 + stages);
      break;
    default:
      break;
  }
  return next;
}

/**
 * 対象デバフ追加効果をバフ段階に反映する。
 * デバフは段階を負方向（または指定段階分）加算する。
 */
export function applyEnemyDebuff(
  buffs: BuffStages,
  debuffType: string,
  stages: number,
): BuffStages {
  const next = { ...buffs };
  switch (debuffType) {
    case '対象陽防低下':
      next.enemyYangDefR1 = clampR1(next.enemyYangDefR1 - stages);
      break;
    case '対象陰防低下':
      next.enemyYinDefR1 = clampR1(next.enemyYinDefR1 - stages);
      break;
    case '対象CRI防御低下':
      // デバフなので enemyCriDefR1 を減らす（負方向 = プレイヤーのCRI強化）
      next.enemyCriDefR1 = clampR1(next.enemyCriDefR1 - stages);
      break;
    case '対象CRI回避低下':
      next.enemyCriEvasionR1 = clampR1(next.enemyCriEvasionR1 - stages);
      break;
    case '対象陽攻低下':
      next.yangAttackR1 = clampR1(next.yangAttackR1 - stages);
      break;
    case '対象陰攻低下':
      next.yinAttackR1 = clampR1(next.yinAttackR1 - stages);
      break;
    case '対象速力低下':
      next.speedR1 = clampHitCriR1(Math.max(0, next.speedR1 - stages));
      break;
    default:
      break;
  }
  return next;
}

// ============================================================
// バフ段階の初期値
// ============================================================

export function createDefaultBuffStages(): BuffStages {
  return {
    yangAttackR1: 0, yangAttackR2: 0,
    yinAttackR1: 0,  yinAttackR2: 0,
    speedR1: 0,      speedR2: 0,
    selfYangDefR1: 0, selfYangDefR2: 0,
    selfYinDefR1: 0,  selfYinDefR2: 0,
    hitRateR1: 0, hitRateR2: 0,
    selfCriAttackR1: 0, selfCriAttackR2: 0,
    selfCriHitR1: 0,    selfCriHitR2: 0,
    enemyYangDefR1: 0, enemyYangDefR2: 0,
    enemyYinDefR1: 0,  enemyYinDefR2: 0,
    enemyCriDefR1: 0,
    enemyCriEvasionR1: 0,
  };
}

// ============================================================
// バフ段階バリデーション
// ============================================================

interface BuffValidationError {
  field: string;
  value: number;
  min: number;
  max: number;
}

export function validateBuffStages(buffs: BuffStages): BuffValidationError[] {
  const errors: BuffValidationError[] = [];

  const check = (value: number, field: string, min: number, max: number) => {
    if (!Number.isFinite(value) || value < min || value > max) {
      errors.push({ field, value, min, max });
    }
  };

  // 攻撃バフ（-10〜+10 / R2: 0〜+10）
  check(buffs.yangAttackR1, '陽攻R1', -10, 10);
  check(buffs.yangAttackR2, '陽攻R2', 0, 10);
  check(buffs.yinAttackR1, '陰攻R1', -10, 10);
  check(buffs.yinAttackR2, '陰攻R2', 0, 10);

  // 速力バフ（0〜+10）
  check(buffs.speedR1, '速力R1', 0, 10);
  check(buffs.speedR2, '速力R2', 0, 10);

  // 自身防御バフ（-10〜+10）
  check(buffs.selfYangDefR1, '自身陽防R1', -10, 10);
  check(buffs.selfYangDefR2, '自身陽防R2', 0, 10);
  check(buffs.selfYinDefR1, '自身陰防R1', -10, 10);
  check(buffs.selfYinDefR2, '自身陰防R2', 0, 10);

  // 敵防御バフ/デバフ（-10〜+10）
  check(buffs.enemyYangDefR1, '敵陽防R1', -10, 10);
  check(buffs.enemyYangDefR2, '敵陽防R2', 0, 10);
  check(buffs.enemyYinDefR1, '敵陰防R1', -10, 10);
  check(buffs.enemyYinDefR2, '敵陰防R2', 0, 10);

  // 命中/CRI系（0〜+10）
  check(buffs.hitRateR1, '命中R1', 0, 10);
  check(buffs.hitRateR2, '命中R2', 0, 10);
  check(buffs.selfCriAttackR1, '自身CRI攻撃R1', 0, 10);
  check(buffs.selfCriAttackR2, '自身CRI攻撃R2', 0, 10);
  check(buffs.selfCriHitR1, '自身CRI命中R1', 0, 10);
  check(buffs.selfCriHitR2, '自身CRI命中R2', 0, 10);
  check(buffs.enemyCriDefR1, '敵CRI防御R1', -10, 10);
  check(buffs.enemyCriEvasionR1, '敵CRI回避R1', -10, 10);

  return errors;
}

export function buffValidationMessages(buffs: BuffStages): string[] {
  return validateBuffStages(buffs).map(
    ({ field, value, min, max }) =>
      `${field}: ${value >= 0 ? '+' : ''}${value}（有効範囲: ${min}〜+${max}）`,
  );
}
