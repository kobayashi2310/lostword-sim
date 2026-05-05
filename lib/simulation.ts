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
} from '@/types';
import { getAdvantageForBullet } from '@/types';
import { applySelfBuff, applyEnemyDebuff } from './buffs';
import { calcExpectedSingleHitDamage, calcStageTotalExpected } from './damage';
import { calcWeightedMultipliers } from './weighted';

// ============================================================
// 追加効果のフラグ判定ユーティリティ
// ============================================================

function hasMustHit(effects: BulletEffect[]): boolean {
  return effects.some((e) => e.kind === '必中');
}

/** バレットが特効能力を持つか（刺さっているかどうかは別途 specialAttackActive で管理） */
export function hasSpecialAttackCapability(effects: BulletEffect[]): boolean {
  return effects.some((e) => e.kind === '特効');
}

// ============================================================
// ヒット順バリデーション
// ============================================================

export interface HitOrderValidationError {
  bulletId: number;
  expected: number; // バレット設定の弾数
  actual: number; // ヒット順での出現数
  message: string;
}

export function validateHitOrder(
  bullets: Bullet[],
  hitOrder: HitOrder,
): HitOrderValidationError[] {
  const errors: HitOrderValidationError[] = [];

  // ヒット順での各バレットの出現数を集計
  const hitCount = new Map<number, number>();
  for (const group of hitOrder) {
    for (const id of group) {
      hitCount.set(id, (hitCount.get(id) ?? 0) + 1);
    }
  }

  // バレット設定の弾数とヒット順の出現数を比較
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

  // ヒット順に存在しないバレットIDが含まれていないか
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
// バレットのバフ/デバフ追加効果をバフ段階に反映し、差分を返す
// （prob=100%前提で処理する）
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
      // 変化したフィールドを記録
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
// バフ段階のリセット（フルブレイク用）
// 敵に関連するバフ・デバフのみをリセットする
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
// ヒット順シミュレーション（期待値: 命中率・CRI率を考慮）
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

  const hitSequence: SingleHitResult[] = [];
  let totalSimDamage = 0;
  let sequenceIndex = 0;
  const effectFiredSet = new Set<number>();
  // 各バレットIDが既に結界を割ったかどうか（1バレットにつき最大1枚）
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

      const isFullBreakBefore = isFullBreak;

      // ダメージ計算（現在のフルブレイク状態を使用）
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
        isFullBreakBefore,
      );
      totalSimDamage += expectedDamage;

      let nextBuffs = { ...currentBuffs };
      let changes: BuffChange[] = [];

      // 結界ブレイク判定
      if (enemyStats.hasBarriers && !isFullBreak && advantage === '有利' && !barrierBrokenSet.has(bulletId)) {
        barrierBrokenSet.add(bulletId);
        barriersRemaining--;
        if (barriersRemaining <= 0) {
          barriersRemaining = 0;
          isFullBreak = true;
          // フルブレイク発生：敵のバフデバフをリセット
          nextBuffs = resetEnemyBuffs(nextBuffs);
          // (リセットによる個別の変化ログは、ノイズになるため記録しない)
        }
      }

      // バレットの追加効果適用（1回目のみ）
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
        isFullBreakBefore,
        isFullBreak,
      });

      currentBuffs = nextBuffs;
      sequenceIndex++;
    }
  }

  return { hitSequence, totalSimDamage };
}

// ============================================================
// バレット単体静的ダメージ計算（弱点設定を使用）
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

  // hitSequence をバレットIDごとに集計して bulletSimResults を作成
  const simDamageMap = new Map<number, number>();
  const simAdvantageMap = new Map<number, ElementalAdvantage>();

  for (const hit of hitSequence) {
    simDamageMap.set(
      hit.bulletId,
      (simDamageMap.get(hit.bulletId) ?? 0) + hit.expectedDamage,
    );
    // 便宜上、最後のヒットの属性相性を記録（通常、1バレット内で変わることはない）
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
// 形式: 1行1グループ、スペース区切りでバレットID
// 例: "1\n1 2\n1\n1 3"
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
