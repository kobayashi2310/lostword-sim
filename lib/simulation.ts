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
  BarrierAilmentType,
} from '@/types';
import { getAdvantageForBullet } from '@/types';
import { applySelfBuff, applyEnemyDebuff, getAilmentStacks } from './buffs';
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
    enemyCriEvasionR1: '敵CRI回避R1',
  };
  const sign = delta >= 0 ? '+' : '';
  return `${labels[field]} ${sign}${delta}`;
}

// ============================================================
// バレットのバフ/デバフ追加効果反映
// ============================================================

function applyBulletEffects(
  buffs: BuffStages,
  effects: BulletEffect[],
): { nextBuffs: BuffStages; changes: BuffChange[] } {
  const changes: BuffChange[] = [];
  let current = { ...buffs };

  for (const effect of effects) {
    if (effect.kind === '必中' || effect.kind === '特効') continue;

    if (effect.kind === '自身バフ') {
      const before = { ...current };
      current = applySelfBuff(current, effect.buffType, effect.stages);
      for (const key of Object.keys(current) as (keyof BuffStages)[]) {
        const delta = current[key] - before[key];
        if (delta !== 0) {
          changes.push({
            field: key,
            delta,
            newValue: current[key],
            label: makeBuffChangeLabel(key, delta),
          });
        }
      }
    } else if (effect.kind === '対象デバフ') {
      const before = { ...current };
      current = applyEnemyDebuff(current, effect.debuffType, effect.stages);
      for (const key of Object.keys(current) as (keyof BuffStages)[]) {
        const delta = current[key] - before[key];
        if (delta !== 0) {
          changes.push({
            field: key,
            delta,
            newValue: current[key],
            label: makeBuffChangeLabel(key, delta),
          });
        }
      }
    }
  }

  return { nextBuffs: current, changes };
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
    enemyCriEvasionR1: 0,
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
  } = config;

  const bulletMap = new Map<number, Bullet>(bullets.map((b) => [b.id, b]));

  let currentBuffs: BuffStages = { ...config.initialBuffs };
  let isFullBreak = enemyStats.hasBarriers && (enemyStats.isFullBreak ?? false);
  let barriersRemaining = (enemyStats.hasBarriers && !isFullBreak) ? enemyStats.initialBarriers : 0;
  let brokenBarrierCount = enemyStats.hasBarriers ? (enemyStats.initialBarriers - barriersRemaining) : 0;

  const hitSequence: SingleHitResult[] = [];
  let totalSimDamage = 0;
  let sequenceIndex = 0;
  const effectFiredSet = new Set<number>();
  const barrierBrokenSet = new Set<number>();

  // 味方の異常枚数 (無効化を考慮)
  const selfAilments = getAilmentStacks(selfStats.barriers, selfStats.ability.nullifyAilments);

  for (const group of hitOrder) {
    for (const bulletId of group) {
      const bullet = bulletMap.get(bulletId);
      if (!bullet) continue;

      const advantage = getAdvantageForBullet(bullet.element, enemyWeakness);
      const mustHit = hasMustHit(bullet.effects);
      const specialAtk =
        hasSpecialAttackCapability(bullet.effects) &&
        (specialAttackActive[bulletId] ?? false);

      let nextBuffs = { ...currentBuffs };
      let changes: BuffChange[] = [];
      let currentHitIsFullBreak = isFullBreak;

      // 結界ブレイク判定 (ダメージ計算前に行う)
      // 「有利」属性によるブレイク。1バレットにつき最大1枚。
      let willBreakByAdvantage = false;
      if (enemyStats.hasBarriers && !isFullBreak && advantage === '有利' && !barrierBrokenSet.has(bulletId)) {
        willBreakByAdvantage = true;
      }

      // 現在の敵異常枚数を集計 (割る前の最新状態を取得)
      const activeEnemyBarriers = (enemyStats.hasBarriers && !isFullBreak)
        ? enemyStats.barriers.slice(brokenBarrierCount, enemyStats.initialBarriers)
        : [];
      const enemyAilments = getAilmentStacks(activeEnemyBarriers, []);

      // ブレイク実行とFB判定
      if (willBreakByAdvantage) {
        barrierBrokenSet.add(bulletId);
        barriersRemaining--;
        brokenBarrierCount++;
        if (barriersRemaining <= 0) {
          barriersRemaining = 0;
          isFullBreak = true;
          currentHitIsFullBreak = true; // この1発からFBダメージを適用する
          nextBuffs = resetEnemyBuffs(nextBuffs);
        }
      }

      // ダメージ計算 (更新された currentHitIsFullBreak を使用)
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
        currentHitIsFullBreak,
        enemyAilments,
        selfAilments,
      );
      totalSimDamage += expectedDamage;

      // バレットの追加効果適用 (1回目のみ)
      if (!effectFiredSet.has(bulletId)) {
        effectFiredSet.add(bulletId);
        const { nextBuffs: buffAfterEffects, changes: effectChanges } = applyBulletEffects(
          nextBuffs,
          bullet.effects,
        );
        nextBuffs = buffAfterEffects;
        changes.push(...effectChanges);
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
        barriersRemaining,
        isFullBreakBefore: currentHitIsFullBreak, // 計算にFBが適用されたか
        isFullBreak, // ヒット終了後のFB状態
        enemyAilments,
        selfAilments,
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

  const isInitialFullBreak = enemyStats.hasBarriers && (enemyStats.isFullBreak ?? false);
  const selfAilments = getAilmentStacks(selfStats.barriers, selfStats.ability.nullifyAilments);
  
  // 静的計算では初期状態の異常枚数を使用
  const enemyAilments = (enemyStats.hasBarriers && !isInitialFullBreak)
    ? getAilmentStacks(enemyStats.barriers.slice(0, enemyStats.initialBarriers), [])
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
