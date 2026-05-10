import type {
  Bullet,
  BulletEffect,
  BulletStaticResult,
  BuffChange,
  BuffStages,
  HitOrder,
  SimulationConfig,
  SimulationResult,
  SingleHitResult,
  ElementalAdvantage,
  BarrierStatus,
} from '@/types';
import { getAdvantageForBullet } from '@/types';
import { applySelfBuff, applyEnemyDebuff, getAilmentStacks } from './buffs';
import { getBreakTargetAilment, inflictAilment } from './barriers';
import { calcExpectedSingleHitDamage, calcStageTotalExpected } from './damage';
import { calcWeightedMultipliers } from './weighted';

// ============================================================
// 追加効果のフラグ判定ユーティリティ
// ============================================================

function hasMustHit(effects: BulletEffect[]): boolean {
  return effects.some((e) => e.kind === '必中');
}

/** バレットが特効能力を持つか */
export function hasSpecialAttackCapability(effects: BulletEffect[]): boolean {
  return effects.some((e) => e.kind === '特効');
}

// ============================================================
// ヒット順バリデーション
// ============================================================

export interface HitOrderValidationError {
  bulletId: number;
  expected: number;
  actual: number;
  message: string;
}

export function validateHitOrder(
  bullets: Bullet[],
  hitOrder: HitOrder,
): HitOrderValidationError[] {
  const errors: HitOrderValidationError[] = [];
  const hitCount = new Map<number, number>();
  for (const group of hitOrder) {
    for (const id of group) {
      hitCount.set(id, (hitCount.get(id) ?? 0) + 1);
    }
  }
  const bulletIds = new Set(bullets.map((b) => b.id));
  for (const bullet of bullets) {
    const actual = hitCount.get(bullet.id) ?? 0;
    if (actual !== bullet.count) {
      errors.push({
        bulletId: bullet.id,
        expected: bullet.count,
        actual,
        message: `バレット${bullet.id}: ヒット順 ${actual}発 ≠ 設定 ${bullet.count}発`,
      });
    }
  }
  for (const [id, count] of hitCount) {
    if (!bulletIds.has(id)) {
      errors.push({
        bulletId: id,
        expected: 0,
        actual: count,
        message: `ヒット順にバレットID ${id} が含まれていますが、バレット設定に存在しません`,
      });
    }
  }
  return errors;
}

// ============================================================
// バフ変化のラベル生成
// ============================================================

function makeBuffChangeLabel(field: keyof BuffStages, delta: number): string {
  const labels: Record<keyof BuffStages, string> = {
    yangAttackR1: '陽攻R1',
    yangAttackR2: '陽攻R2',
    yinAttackR1: '陰攻R1',
    yinAttackR2: '陰攻R2',
    speedR1: '速力R1',
    speedR2: '速力R2',
    selfYangDefR1: '自身陽防R1',
    selfYangDefR2: '自身陽防R2',
    selfYinDefR1: '自身陰防R1',
    selfYinDefR2: '自身陰防R2',
    enemyYangDefR1: '敵陽防R1',
    enemyYangDefR2: '敵陽防R2',
    enemyYinDefR1: '敵陰防R1',
    enemyYinDefR2: '敵陰防R2',
    selfHitR1: '命中R1',
    selfHitR2: '命中R2',
    enemyEvasionR1: '敵回避R1',
    enemyEvasionR2: '敵回避R2',
    selfCriAttackR1: '自身CRI攻撃R1',
    selfCriAttackR2: '自身CRI攻撃R2',
    selfCriHitR1: '自身CRI命中R1',
    selfCriHitR2: '自身CRI命中R2',
    enemyCriDefR1: '敵CRI防御R1',
    enemyCriDefR2: '敵CRI防御R2',
    enemyCriEvasionR1: '敵CRI回避R1',
    enemyCriEvasionR2: '敵CRI回避R2',
  };
  const sign = delta >= 0 ? '+' : '';
  return `${labels[field]} ${sign}${delta}`;
}

// ============================================================
// バレットの追加効果反映
// ============================================================

function applyBulletEffects(
  buffs: BuffStages,
  effects: BulletEffect[],
  currentSelfBarriers: BarrierStatus[],
  currentEnemyBarriers: BarrierStatus[],
): {
  nextBuffs: BuffStages;
  changes: BuffChange[];
  nextSelfBarriers: BarrierStatus[];
  nextEnemyBarriers: BarrierStatus[];
} {
  const changes: BuffChange[] = [];
  let currentBuffs = { ...buffs };
  let nextSelfBarriers = [...currentSelfBarriers];
  let nextEnemyBarriers = [...currentEnemyBarriers];

  for (const effect of effects) {
    if (
      effect.kind === '必中' ||
      effect.kind === '特効' ||
      effect.kind === 'ブレイク'
    )
      continue;

    if (effect.kind === '自身バフ') {
      const before = { ...currentBuffs };
      currentBuffs = applySelfBuff(
        currentBuffs,
        effect.buffType,
        effect.stages,
      );
      for (const key of Object.keys(currentBuffs) as (keyof BuffStages)[]) {
        const delta = currentBuffs[key] - before[key];
        if (delta !== 0) {
          changes.push({
            field: key,
            delta,
            newValue: currentBuffs[key],
            label: makeBuffChangeLabel(key, delta),
          });
        }
      }
    } else if (effect.kind === '対象デバフ') {
      const before = { ...currentBuffs };
      currentBuffs = applyEnemyDebuff(
        currentBuffs,
        effect.debuffType,
        effect.stages,
      );
      for (const key of Object.keys(currentBuffs) as (keyof BuffStages)[]) {
        const delta = currentBuffs[key] - before[key];
        if (delta !== 0) {
          changes.push({
            field: key,
            delta,
            newValue: currentBuffs[key],
            label: makeBuffChangeLabel(key, delta),
          });
        }
      }
    } else if (effect.kind === '異常付与') {
      if (effect.target === 'self') {
        nextSelfBarriers = inflictAilment(nextSelfBarriers, effect.ailmentType);
      } else {
        nextEnemyBarriers = inflictAilment(
          nextEnemyBarriers,
          effect.ailmentType,
        );
      }
    }
  }

  return {
    nextBuffs: currentBuffs,
    changes,
    nextSelfBarriers,
    nextEnemyBarriers,
  };
}

// ============================================================
// 敵バフのリセット
// ============================================================

function resetEnemyBuffs(buffs: BuffStages): BuffStages {
  return {
    ...buffs,
    enemyYangDefR1: 0,
    enemyYangDefR2: 0,
    enemyYinDefR1: 0,
    enemyYinDefR2: 0,
    enemyEvasionR1: 0,
    enemyEvasionR2: 0,
    enemyCriDefR1: 0,
    enemyCriDefR2: 0,
    enemyCriEvasionR1: 0,
    enemyCriEvasionR2: 0,
  };
}

// ============================================================
// ヒット順シミュレーション
// ============================================================

function runHitOrderSimulation(config: SimulationConfig): {
  hitSequence: SingleHitResult[];
  totalSimDamage: number;
} {
  const {
    selfStats,
    enemyStats,
    bullets,
    hitOrder,
    isGirlReincarnation,
    enemyWeakness,
    specialAttackActive,
    damageBonus,
    activeBulletCount,
  } = config;

  const activeBullets = bullets.filter((b) => b.id <= activeBulletCount);
  const bulletMap = new Map<number, Bullet>(
    activeBullets.map((b) => [b.id, b]),
  );

  let currentBuffs: BuffStages = { ...config.initialBuffs };
  let isFullBreak = enemyStats.hasBarriers && (enemyStats.isFullBreak ?? false);

  // 現在の結界状態を管理（敵は残りの枚数分のみを保持し、割れると要素が減る）
  let currentEnemyBarriers: BarrierStatus[] =
    enemyStats.hasBarriers && !isFullBreak
      ? [...enemyStats.barriers.slice(0, enemyStats.initialBarriers)]
      : [];

  let currentSelfBarriers: BarrierStatus[] = [...selfStats.barriers];

  const hitSequence: SingleHitResult[] = [];
  let totalSimDamage = 0;
  let sequenceIndex = 0;
  const effectFiredSet = new Set<number>();
  const barrierBrokenSet = new Set<number>();

  for (const group of hitOrder) {
    for (const bulletId of group) {
      const bullet = bulletMap.get(bulletId);
      if (!bullet) continue;

      const advantage = getAdvantageForBullet(bullet.element, enemyWeakness);
      const mustHit = hasMustHit(bullet.effects);
      const specialAtk =
        hasSpecialAttackCapability(bullet.effects) &&
        (specialAttackActive[bulletId] ?? false);

      const isFullBreakBeforeThisBullet = isFullBreak;
      let nextBuffs = { ...currentBuffs };
      const changes: BuffChange[] = [];

      // 1. ブレイク判定 (ダメージ計算前)
      const breakTargetAilment = getBreakTargetAilment(bullet.effects);
      let brokenThisBullet = 0;

      // 1-a. ブレイク弾による複数枚ブレイク
      if (enemyStats.hasBarriers && !isFullBreak && breakTargetAilment) {
        // 対象の異常がある結界を特定
        const newBarriers: BarrierStatus[] = [];
        for (const b of currentEnemyBarriers) {
          if (b.ailment === breakTargetAilment) {
            brokenThisBullet++;
          } else {
            newBarriers.push(b);
          }
        }
        currentEnemyBarriers = newBarriers;
      }

      // 1-b. 属性有利によるブレイク (1バレットにつき最大1枚)
      if (
        enemyStats.hasBarriers &&
        !isFullBreak &&
        advantage === '有利' &&
        !barrierBrokenSet.has(bulletId)
      ) {
        if (currentEnemyBarriers.length > 0) {
          // 先頭から1枚割る
          currentEnemyBarriers.shift();
          barrierBrokenSet.add(bulletId);
        }
      }

      if (
        enemyStats.hasBarriers &&
        !isFullBreak &&
        currentEnemyBarriers.length === 0
      ) {
        isFullBreak = true;
        // FB発生の瞬間に、計算用バフと次回のバフを両方リセットする
        currentBuffs = resetEnemyBuffs(currentBuffs);
        nextBuffs = { ...currentBuffs };
      }

      // 現在の異常枚数を集計
      const enemyAilmentStacks = getAilmentStacks(currentEnemyBarriers);
      const selfAilmentStacks = getAilmentStacks(currentSelfBarriers);

      // 2. ダメージ計算
      const expectedDamage = calcExpectedSingleHitDamage(
        bullet,
        selfStats,
        enemyStats,
        currentBuffs,
        isGirlReincarnation,
        advantage,
        mustHit,
        specialAtk,
        damageBonus,
        isFullBreak,
        enemyAilmentStacks,
        selfAilmentStacks,
      );
      totalSimDamage += expectedDamage;

      // 3. 追加効果の適用 (1回目のみ)
      if (!effectFiredSet.has(bulletId)) {
        effectFiredSet.add(bulletId);
        const {
          nextBuffs: buffAfterEffects,
          changes: effectChanges,
          nextSelfBarriers,
          nextEnemyBarriers,
        } = applyBulletEffects(
          nextBuffs,
          bullet.effects,
          currentSelfBarriers,
          currentEnemyBarriers,
        );

        nextBuffs = buffAfterEffects;
        changes.push(...effectChanges);
        currentSelfBarriers = nextSelfBarriers;
        currentEnemyBarriers = nextEnemyBarriers;

        // 異常付与によってFBになることはない（はず）だが、念のため状態更新
        if (
          enemyStats.hasBarriers &&
          !isFullBreak &&
          currentEnemyBarriers.length === 0
        ) {
          isFullBreak = true;
          nextBuffs = resetEnemyBuffs(nextBuffs);
        }
      }

      hitSequence.push({
        sequenceIndex,
        bulletId,
        elementalAdvantage: advantage,
        mustHit,
        specialAttack: specialAtk,
        expectedDamage,
        buffChanges: changes,
        buffStateBefore: { ...currentBuffs },
        buffStateAfter: { ...nextBuffs },
        barriersRemaining: currentEnemyBarriers.length,
        isFullBreakBefore: isFullBreakBeforeThisBullet,
        isFullBreak,
        enemyAilments: enemyAilmentStacks,
        selfAilments: selfAilmentStacks,
      });

      currentBuffs = nextBuffs;
      sequenceIndex++;
    }
  }

  return { hitSequence, totalSimDamage };
}

// ============================================================
// バレット単体静的ダメージ計算
// ============================================================

function runStaticBulletCalculation(config: SimulationConfig): {
  bulletStaticResults: BulletStaticResult[];
  totalStaticDamage: number;
} {
  const {
    selfStats,
    enemyStats,
    bullets,
    initialBuffs,
    isGirlReincarnation,
    enemyWeakness,
    specialAttackActive,
    damageBonus,
  } = config;

  const bulletStaticResults: BulletStaticResult[] = [];
  let totalStaticDamage = 0;

  const isInitialFullBreak =
    enemyStats.hasBarriers && (enemyStats.isFullBreak ?? false);
  const selfAilments = getAilmentStacks(selfStats.barriers);

  const enemyAilments =
    enemyStats.hasBarriers && !isInitialFullBreak
      ? getAilmentStacks(
          enemyStats.barriers.slice(0, enemyStats.initialBarriers),
        )
      : { 燃焼: 0, 凍結: 0, 帯電: 0, 毒霧: 0, 暗闇: 0 };

  for (const bullet of bullets) {
    const mustHit = hasMustHit(bullet.effects);
    const specialAtk =
      hasSpecialAttackCapability(bullet.effects) &&
      (specialAttackActive[bullet.id] ?? false);
    const advantage = getAdvantageForBullet(bullet.element, enemyWeakness);

    const expectedDamage = calcStageTotalExpected(
      bullet,
      selfStats,
      enemyStats,
      initialBuffs,
      isGirlReincarnation,
      advantage,
      mustHit,
      specialAtk,
      damageBonus,
      isInitialFullBreak,
      enemyAilments,
      selfAilments,
    );
    totalStaticDamage += expectedDamage;

    bulletStaticResults.push({
      bulletId: bullet.id,
      advantage,
      expectedDamage,
    });
  }

  return { bulletStaticResults, totalStaticDamage };
}

// ============================================================
// メインシミュレーション関数
// ============================================================

export function runSimulation(config: SimulationConfig): SimulationResult {
  const { hitSequence, totalSimDamage } = runHitOrderSimulation(config);
  const { bulletStaticResults, totalStaticDamage } =
    runStaticBulletCalculation(config);
  const weightedMultipliers = calcWeightedMultipliers(config.bullets);

  const simDamageMap = new Map<number, number>();
  const simAdvantageMap = new Map<number, ElementalAdvantage>();

  for (const hit of hitSequence) {
    simDamageMap.set(
      hit.bulletId,
      (simDamageMap.get(hit.bulletId) ?? 0) + hit.expectedDamage,
    );
    simAdvantageMap.set(hit.bulletId, hit.elementalAdvantage);
  }

  const bulletSimResults: BulletStaticResult[] = config.bullets.map((b) => ({
    bulletId: b.id,
    advantage: simAdvantageMap.get(b.id) ?? '等倍',
    expectedDamage: simDamageMap.get(b.id) ?? 0,
  }));

  return {
    hitSequence,
    totalSimDamage,
    bulletSimResults,
    bulletStaticResults,
    totalStaticDamage,
    weightedMultipliers,
  };
}

// ============================================================
// ヒット順テキストパース
// ============================================================

export function parseHitOrder(text: string): HitOrder {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      line
        .split(/\s+/)
        .map((s) => parseInt(s, 10))
        .filter((n) => !isNaN(n) && n >= 1),
    )
    .filter((group) => group.length > 0);
}

export function serializeHitOrder(hitOrder: HitOrder): string {
  return hitOrder.map((group) => group.join(' ')).join('\n');
}
