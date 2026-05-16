import { describe, it, expect } from 'vitest';
import { calcSingleHitDamage, calcAttackPower, calcEnemyDefense } from '@/lib/damage';
import { createDefaultBuffStages } from '@/lib/buffs';
import { createDefaultAbilityConfig, createDefaultGreatBarrierConfig } from '@/types';
import type { Bullet, SelfStats, EnemyStats, DamageBonus, GreatBarrierEntry, GreatBarrierStatType, GreatBarrierDir } from '@/types';

describe('GreatBarrier Logic Tests', () => {
  const defaultAbility = createDefaultAbilityConfig();
  const buffs = createDefaultBuffStages();

  const selfStats: SelfStats = {
    yangAttack: 2000,
    yinAttack: 2000,
    speed: 1000,
    yangDefense: 1000,
    yinDefense: 1000,
    barriers: Array(5).fill({ ailment: null }) as any,
    ability: defaultAbility,
  };

  const enemyStats: EnemyStats = {
    yangDefense: 1000,
    yinDefense: 1000,
    hasBarriers: true,
    initialBarriers: 5,
    isFullBreak: false,
    barriers: Array(7).fill({ ailment: null }) as any,
    ability: defaultAbility,
  };

  const baseBullet: Bullet = {
    id: 1,
    element: '無',
    yinYang: '陽気',
    bulletKind: '通常弾',
    power: 10,
    count: 1,
    hitRate: 100,
    criRate: 0,
    slashPercent: 0,
    hardPercent: 0,
    isPenetration: false,
    effects: [],
  };

  const baseBonus: DamageBonus = {
    elementBonus: {},
    bulletKindBonus: {},
    advantageBonus: 0,
    disadvantageBonus: 0,
    chargeEffects: [],
    accumulationEffects: [],
    resonanceEffects: [],
    greatBarrier: null,
  };

  function entry(
    stat: GreatBarrierStatType,
    selfDir: GreatBarrierDir,
    selfValue: number,
    enemyValue: number,
  ): GreatBarrierEntry {
    return { id: 1, stat, selfDir, selfValue, enemyValue };
  }

  function withGB(entries: GreatBarrierEntry[]): DamageBonus {
    return { ...baseBonus, greatBarrier: { entries } };
  }

  // ── 威力補正 ─────────────────────────────────────────────
  it('should apply power bonus (60% UP → power * 1.6)', () => {
    const dmgBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, baseBonus);
    const dmgGB = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, withGB([entry('威力', 'UP', 60, 0)]));
    expect(dmgGB).toBe(Math.floor(dmgBase * 1.6));
  });

  it('should not apply power bonus when greatBarrier is null', () => {
    const dmgBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, baseBonus);
    const dmgNoGB = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, { ...baseBonus, greatBarrier: null });
    expect(dmgNoGB).toBe(dmgBase);
  });

  it('should apply power DOWN correctly (60% DOWN → power * 0.4)', () => {
    const dmgBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, baseBonus);
    const dmgGB = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, withGB([entry('威力', 'DOWN', 60, 0)]));
    expect(dmgGB).toBe(Math.floor(dmgBase * 0.4));
  });

  // ── 自身陽攻補正 ─────────────────────────────────────────
  it('should apply self yang attack bonus (30% UP → attackPower * 1.3)', () => {
    const yangBullet = { ...baseBullet, yinYang: '陽気' as const };
    const atkBase = calcAttackPower(selfStats, buffs, yangBullet, undefined, baseBonus);
    const atkGB = calcAttackPower(selfStats, buffs, yangBullet, undefined, withGB([entry('陽攻', 'UP', 30, 0)]));
    expect(atkGB).toBe(Math.floor(atkBase * 1.3));
  });

  it('should apply self yin attack bonus (50% UP) only to yin bullets', () => {
    const yinBullet = { ...baseBullet, yinYang: '陰気' as const };
    const yangBullet = { ...baseBullet, yinYang: '陽気' as const };
    const bonus = withGB([entry('陰攻', 'UP', 50, 0)]);

    const atkYinBase = calcAttackPower(selfStats, buffs, yinBullet, undefined, baseBonus);
    const atkYinGB = calcAttackPower(selfStats, buffs, yinBullet, undefined, bonus);
    const atkYangBase = calcAttackPower(selfStats, buffs, yangBullet, undefined, baseBonus);
    const atkYangGB = calcAttackPower(selfStats, buffs, yangBullet, undefined, bonus);

    expect(atkYinGB).toBe(Math.floor(atkYinBase * 1.5));
    expect(atkYangGB).toBe(atkYangBase);
  });

  // ── 自身速力補正（斬裂弾） ───────────────────────────────
  it('should apply speed bonus to slash bullet attack power', () => {
    const slashBullet = { ...baseBullet, slashPercent: 100 };
    // 基礎: 陽攻2000 + 速力1000 = 3000
    // 大結界(速力100%UP): 陽攻2000 + 速力2000 = 4000
    const atkBase = calcAttackPower(selfStats, buffs, slashBullet, undefined, baseBonus);
    const atkGB = calcAttackPower(selfStats, buffs, slashBullet, undefined, withGB([entry('速力', 'UP', 100, 0)]));
    expect(atkBase).toBe(3000);
    expect(atkGB).toBe(4000);
  });

  // ── 敵陽防デバフ ─────────────────────────────────────────
  it('should apply enemy yang def debuff (selfDir=UP, enemy 50% DOWN → def * 0.5)', () => {
    const defBase = calcEnemyDefense(enemyStats, buffs, baseBullet);
    const defGB = calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, false, withGB([entry('陽防', 'UP', 0, 50)]));
    expect(defGB).toBeCloseTo(defBase * 0.5, 5);
  });

  it('should apply enemy yin def debuff only to yin bullets', () => {
    const yinBullet = { ...baseBullet, yinYang: '陰気' as const };
    const bonus = withGB([entry('陰防', 'UP', 0, 30)]);

    const defYang = calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, false, bonus);
    const defYin = calcEnemyDefense(enemyStats, buffs, yinBullet, undefined, false, bonus);
    const defYinBase = calcEnemyDefense(enemyStats, buffs, yinBullet, undefined, false, baseBonus);

    expect(defYang).toBe(calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, false, baseBonus));
    expect(defYin).toBeCloseTo(defYinBase * 0.7, 5);
  });

  // ── 大結界デバフはFB中も有効 ────────────────────────────
  it('should apply enemy def debuff even during full break', () => {
    const defFBnoGB = calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, true, baseBonus);
    const defFBwithGB = calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, true, withGB([entry('陽防', 'UP', 0, 50)]));
    expect(defFBwithGB).toBeCloseTo(defFBnoGB * 0.5, 5);
  });

  it('normal rank debuffs are nullified during full break but great barrier is not', () => {
    const buffsWithDebuff = { ...createDefaultBuffStages(), enemyYangDefR1: -5 };

    const defFBnoDebuff = calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, true, baseBonus);
    const defFBwithDebuff = calcEnemyDefense(enemyStats, buffsWithDebuff, baseBullet, undefined, true, baseBonus);
    expect(defFBwithDebuff).toBe(defFBnoDebuff);

    const defFBwithGB = calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, true, withGB([entry('陽防', 'UP', 0, 50)]));
    expect(defFBwithGB).toBeLessThan(defFBnoDebuff);
  });

  // ── selfDir=DOWN の場合、相手が UP になる ────────────────
  it('should apply enemy def UP when selfDir=DOWN (enemy yang def * 1.5)', () => {
    const defBase = calcEnemyDefense(enemyStats, buffs, baseBullet);
    const defGB = calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, false, withGB([entry('陽防', 'DOWN', 0, 50)]));
    expect(defGB).toBeCloseTo(defBase * 1.5, 5);
  });

  // ── CRI攻撃補正 ─────────────────────────────────────────
  it('should apply CRI attack self bonus only on critical hits', () => {
    const dmgNonCrit = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, withGB([entry('CRI攻撃/CRI防御', 'UP', 50, 0)]));
    const dmgCrit = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', true, withGB([entry('CRI攻撃/CRI防御', 'UP', 50, 0)]));
    const dmgNonCritBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, baseBonus);
    const dmgCritBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', true, baseBonus);

    expect(dmgNonCrit).toBe(dmgNonCritBase);
    expect(dmgCrit).toBe(Math.floor(dmgCritBase * 1.5));
  });

  // ── 敵CRI防御デバフ ─────────────────────────────────────
  it('should apply enemy CRI defense debuff only on critical hits (50% DOWN → CRI damage * 1.5)', () => {
    const dmgNonCrit = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, withGB([entry('CRI攻撃/CRI防御', 'UP', 0, 50)]));
    const dmgCrit = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', true, withGB([entry('CRI攻撃/CRI防御', 'UP', 0, 50)]));
    const dmgNonCritBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, baseBonus);
    const dmgCritBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', true, baseBonus);

    expect(dmgNonCrit).toBe(dmgNonCritBase);
    expect(dmgCrit).toBe(Math.floor(dmgCritBase * 1.5));
  });

  // ── CRI自身 + CRI敵複合 ─────────────────────────────────
  it('should stack CRI self and enemy debuff multiplicatively (1.5 * 1.5 = 2.25)', () => {
    const dmgCritBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', true, baseBonus);
    const dmgCritGB = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', true, withGB([entry('CRI攻撃/CRI防御', 'UP', 50, 50)]));
    expect(dmgCritGB).toBe(Math.floor(dmgCritBase * 2.25));
  });

  // ── 複数エントリの積算 ────────────────────────────────────
  it('should multiply multiple entries for the same stat', () => {
    const atkBase = calcAttackPower(selfStats, buffs, baseBullet, undefined, baseBonus);
    // 陽攻 30%UP * 陽攻 20%UP = 1.3 * 1.2 = 1.56
    const atkGB = calcAttackPower(selfStats, buffs, baseBullet, undefined, withGB([
      entry('陽攻', 'UP', 30, 0),
      entry('陽攻', 'UP', 20, 0),
    ]));
    expect(atkGB).toBe(Math.floor(atkBase * 1.56));
  });
});
