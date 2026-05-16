import { describe, it, expect } from 'vitest';
import { calcSingleHitDamage, calcExpectedSingleHitDamage, calcAttackPower } from '@/lib/damage';
import { createDefaultBuffStages } from '@/lib/buffs';
import { createDefaultAbilityConfig } from '@/types';
import type { Bullet, SelfStats, EnemyStats, DamageBonus } from '@/types';

describe('Resonance Logic Tests', () => {
  const defaultAbility = createDefaultAbilityConfig();
  const selfStats: SelfStats = {
    yangAttack: 2000,
    yinAttack: 2000,
    speed: 1000,
    yangDefense: 1000,
    yinDefense: 1000,
    barriers: Array(5).fill({ ailment: null }) as any,
    ability: defaultAbility,
    characterClass: 'なし',
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

  const normalBullet: Bullet = {
    id: 1,
    element: '無',
    yinYang: '陽気',
    bulletKind: '通常弾',
    power: 10,
    count: 1,
    hitRate: 100,
    criRate: 10,
    slashPercent: 0,
    hardPercent: 0,
    isPenetration: false,
    effects: [],
  };

  const slashBullet: Bullet = {
    ...normalBullet,
    slashPercent: 100, // 速力の100%を攻撃力に加算
  };

  const buffs = createDefaultBuffStages();

  it('should apply resonance damage bonus (ダメージアップ)', () => {
    const bonusNoRes: DamageBonus = {
      elementBonus: {},
      bulletKindBonus: {},
      advantageBonus: 0,
      disadvantageBonus: 0,
      chargeEffects: [],
      accumulationEffects: [],
      resonanceEffects: [],
    };

    const bonusWithRes: DamageBonus = {
      ...bonusNoRes,
      resonanceEffects: [{ kind: 'ダメージアップ', value: 20 }],
    };

    const dmgBase = calcSingleHitDamage(normalBullet, selfStats, enemyStats, buffs, false, '等倍', false, bonusNoRes);
    const dmgRes = calcSingleHitDamage(normalBullet, selfStats, enemyStats, buffs, false, '等倍', false, bonusWithRes);

    // 20%アップなので 1.2倍
    expect(dmgRes).toBe(Math.floor(dmgBase * 1.2));
  });

  it('should apply resonance CRI damage bonus only on critical hits (CRI時ダメージアップ)', () => {
    const bonusWithRes: DamageBonus = {
      elementBonus: {},
      bulletKindBonus: {},
      advantageBonus: 0,
      disadvantageBonus: 0,
      chargeEffects: [],
      accumulationEffects: [],
      resonanceEffects: [{ kind: 'CRI時ダメージアップ', value: 50 }],
    };

    const dmgNonCrit = calcSingleHitDamage(normalBullet, selfStats, enemyStats, buffs, false, '等倍', false, bonusWithRes);
    const dmgCrit = calcSingleHitDamage(normalBullet, selfStats, enemyStats, buffs, false, '等倍', true, bonusWithRes);

    // 非CRI時は影響なし
    const dmgBase = calcSingleHitDamage(normalBullet, selfStats, enemyStats, buffs, false, '等倍', false);
    expect(dmgNonCrit).toBe(dmgBase);

    // CRI時は本来のCRIダメージ(2.0倍)に対してさらに1.5倍
    const dmgCritBase = calcSingleHitDamage(normalBullet, selfStats, enemyStats, buffs, false, '等倍', true);
    expect(dmgCrit).toBe(Math.floor(dmgCritBase * 1.5));
  });

  it('should apply resonance CRI rate bonus to base CRI rate (攻撃時CRI率)', () => {
    const bonusWithRes: DamageBonus = {
      elementBonus: {},
      bulletKindBonus: {},
      advantageBonus: 0,
      disadvantageBonus: 0,
      chargeEffects: [],
      accumulationEffects: [],
      resonanceEffects: [{ kind: '攻撃時CRI率', value: 20 }], // 基礎10% + 共鳴20% = 30%
    };

    // 期待値計算で確認
    // 非CRI: 800, CRI: 1600 (例)
    // 通常: 800 * 0.9 + 1600 * 0.1 = 720 + 160 = 880
    // 共鳴: 800 * 0.7 + 1600 * 0.3 = 560 + 480 = 1040
    const expBase = calcExpectedSingleHitDamage(normalBullet, selfStats, enemyStats, buffs, false, '等倍', true, false);
    const expRes = calcExpectedSingleHitDamage(normalBullet, selfStats, enemyStats, buffs, false, '等倍', true, false, bonusWithRes);

    expect(expRes).toBeGreaterThan(expBase);
  });

  it('should apply resonance speed bonus and affect slash bullets (速力)', () => {
    const bonusWithRes: DamageBonus = {
      elementBonus: {},
      bulletKindBonus: {},
      advantageBonus: 0,
      disadvantageBonus: 0,
      chargeEffects: [],
      accumulationEffects: [],
      resonanceEffects: [{ kind: '速力', value: 100 }], // 速力2倍 (1000 -> 2000)
    };

    // 斬裂弾の攻撃力計算で確認
    // 基礎攻撃力 2000
    // 斬裂加算 (速力1000 * 1.0) = 1000 -> 合計 3000
    // 共鳴あり (速力2000 * 1.0) = 2000 -> 合計 4000
    const atkBase = calcAttackPower(selfStats, buffs, slashBullet);
    const atkRes = calcAttackPower(selfStats, buffs, slashBullet, undefined, bonusWithRes);

    expect(atkBase).toBe(3000);
    expect(atkRes).toBe(4000);
  });
});
