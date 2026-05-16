import { describe, it, expect } from 'vitest';
import { calcSingleHitDamage, calcAttackPower, calcEnemyDefense } from '@/lib/damage';
import { createDefaultBuffStages } from '@/lib/buffs';
import { createDefaultAbilityConfig, createDefaultGreatBarrierConfig } from '@/types';
import type { Bullet, SelfStats, EnemyStats, DamageBonus, GreatBarrierConfig } from '@/types';

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

  function withGB(gb: Partial<GreatBarrierConfig>): DamageBonus {
    return {
      ...baseBonus,
      greatBarrier: { ...createDefaultGreatBarrierConfig(), ...gb },
    };
  }

  // ── 威力補正 ─────────────────────────────────────────────
  it('should apply power bonus (60% UP → power * 1.6)', () => {
    const dmgBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, baseBonus);
    const dmgGB = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, withGB({ powerBonus: 60 }));
    expect(dmgGB).toBe(Math.floor(dmgBase * 1.6));
  });

  it('should not apply power bonus when greatBarrier is null', () => {
    const dmgBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, baseBonus);
    const dmgNoGB = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, { ...baseBonus, greatBarrier: null });
    expect(dmgNoGB).toBe(dmgBase);
  });

  // ── 自身陽攻補正 ─────────────────────────────────────────
  it('should apply self yang attack bonus (30% UP → attackPower * 1.3)', () => {
    const yangBullet = { ...baseBullet, yinYang: '陽気' as const };
    const atkBase = calcAttackPower(selfStats, buffs, yangBullet, undefined, baseBonus);
    const atkGB = calcAttackPower(selfStats, buffs, yangBullet, undefined, withGB({ selfYangAttack: 30 }));
    expect(atkGB).toBe(Math.floor(atkBase * 1.3));
  });

  it('should apply self yin attack bonus (50% UP) only to yin bullets', () => {
    const yinBullet = { ...baseBullet, yinYang: '陰気' as const };
    const yangBullet = { ...baseBullet, yinYang: '陽気' as const };
    const bonus = withGB({ selfYinAttack: 50 });

    const atkYinBase = calcAttackPower(selfStats, buffs, yinBullet, undefined, baseBonus);
    const atkYinGB = calcAttackPower(selfStats, buffs, yinBullet, undefined, bonus);
    const atkYangBase = calcAttackPower(selfStats, buffs, yangBullet, undefined, baseBonus);
    const atkYangGB = calcAttackPower(selfStats, buffs, yangBullet, undefined, bonus);

    // 陰気弾のみ補正
    expect(atkYinGB).toBe(Math.floor(atkYinBase * 1.5));
    // 陽気弾は影響なし
    expect(atkYangGB).toBe(atkYangBase);
  });

  // ── 自身速力補正（斬裂弾） ───────────────────────────────
  it('should apply speed bonus to slash bullet attack power', () => {
    const slashBullet = { ...baseBullet, slashPercent: 100 };
    // 基礎: 陽攻2000 + 速力1000 = 3000
    // 大結界(速力100%UP): 陽攻2000 + 速力2000 = 4000
    const atkBase = calcAttackPower(selfStats, buffs, slashBullet, undefined, baseBonus);
    const atkGB = calcAttackPower(selfStats, buffs, slashBullet, undefined, withGB({ selfSpeed: 100 }));
    expect(atkBase).toBe(3000);
    expect(atkGB).toBe(4000);
  });

  // ── 敵陽防デバフ ─────────────────────────────────────────
  it('should apply enemy yang def debuff (50% DOWN → def * 0.5)', () => {
    const defBase = calcEnemyDefense(enemyStats, buffs, baseBullet);
    const defGB = calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, false, withGB({ enemyYangDef: -50 }));
    expect(defGB).toBeCloseTo(defBase * 0.5, 5);
  });

  it('should apply enemy yin def debuff only to yin bullets', () => {
    const yinBullet = { ...baseBullet, yinYang: '陰気' as const };
    const bonus = withGB({ enemyYinDef: -30 });

    const defYang = calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, false, bonus);
    const defYin = calcEnemyDefense(enemyStats, buffs, yinBullet, undefined, false, bonus);
    const defYinBase = calcEnemyDefense(enemyStats, buffs, yinBullet, undefined, false, baseBonus);

    // 陽気弾に陰防デバフは効かない
    expect(defYang).toBe(calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, false, baseBonus));
    // 陰気弾には効く
    expect(defYin).toBeCloseTo(defYinBase * 0.7, 5);
  });

  // ── 大結界デバフはFB中も有効 ────────────────────────────
  it('should apply enemy def debuff even during full break', () => {
    // FB中: 通常Rankデバフは無効。大結界は有効。
    const defFBnoGB = calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, true, baseBonus);
    const defFBwithGB = calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, true, withGB({ enemyYangDef: -50 }));

    // FB中 + 大結界50%ダウン = FB補正 * 0.5
    expect(defFBwithGB).toBeCloseTo(defFBnoGB * 0.5, 5);
  });

  it('normal rank debuffs are nullified during full break but great barrier is not', () => {
    const buffsWithDebuff = {
      ...createDefaultBuffStages(),
      enemyYangDefR1: -5,
    };

    // FB中: Rankデバフは無効 → 両者同値
    const defFBnoDebuff = calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, true, baseBonus);
    const defFBwithDebuff = calcEnemyDefense(enemyStats, buffsWithDebuff, baseBullet, undefined, true, baseBonus);
    expect(defFBwithDebuff).toBe(defFBnoDebuff);

    // 大結界はFB中でも有効
    const defFBwithGB = calcEnemyDefense(enemyStats, buffs, baseBullet, undefined, true, withGB({ enemyYangDef: -50 }));
    expect(defFBwithGB).toBeLessThan(defFBnoDebuff);
  });

  // ── CRI攻撃補正 ─────────────────────────────────────────
  it('should apply CRI attack bonus only on critical hits', () => {
    // CRI時にのみ (1 + 0.5) = 1.5倍
    const dmgNonCrit = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, withGB({ criAttack: 50 }));
    const dmgCrit = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', true, withGB({ criAttack: 50 }));

    const dmgNonCritBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, baseBonus);
    const dmgCritBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', true, baseBonus);

    // 非CRI時は影響なし
    expect(dmgNonCrit).toBe(dmgNonCritBase);
    // CRI時は 1.5倍
    expect(dmgCrit).toBe(Math.floor(dmgCritBase * 1.5));
  });

  // ── 敵CRI防御デバフ ─────────────────────────────────────
  it('should apply enemy CRI defense debuff only on critical hits (50% DOWN → CRI damage * 1.5)', () => {
    const dmgNonCrit = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, withGB({ enemyCriDef: -50 }));
    const dmgCrit = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', true, withGB({ enemyCriDef: -50 }));

    const dmgNonCritBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', false, baseBonus);
    const dmgCritBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', true, baseBonus);

    expect(dmgNonCrit).toBe(dmgNonCritBase);
    expect(dmgCrit).toBe(Math.floor(dmgCritBase * 1.5));
  });

  // ── CRI攻撃 + CRI防御デバフ複合 ─────────────────────────
  it('should stack CRI attack and enemy CRI defense debuff multiplicatively', () => {
    // CRI攻撃50%UP × 敵CRI防御50%DOWN = 1.5 × 1.5 = 2.25
    const dmgCritBase = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', true, baseBonus);
    const dmgCritGB = calcSingleHitDamage(baseBullet, selfStats, enemyStats, buffs, false, '等倍', true, withGB({ criAttack: 50, enemyCriDef: -50 }));
    expect(dmgCritGB).toBe(Math.floor(dmgCritBase * 2.25));
  });
});
