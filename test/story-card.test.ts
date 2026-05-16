import { describe, it, expect } from 'vitest';
import { calcSingleHitDamage } from '@/lib/damage';
import { createDefaultBuffStages } from '@/lib/buffs';
import { createDefaultAbilityConfig } from '@/types';
import type { Bullet, SelfStats, EnemyStats, DamageBonus, BuffStages } from '@/types';

describe('StoryCard 対象デバフ', () => {
  const defaultAbility = createDefaultAbilityConfig();

  const selfStats: SelfStats = {
    yangAttack: 2000,
    yinAttack: 2000,
    speed: 1000,
    yangDefense: 1000,
    yinDefense: 1000,
    barriers: Array(5).fill({ ailment: null }) as any,
    ability: defaultAbility,
    characterClass: '攻撃式',
  };

  const enemyStats: EnemyStats = {
    yangDefense: 1000,
    yinDefense: 1000,
    hasBarriers: false,
    initialBarriers: 0,
    isFullBreak: false,
    barriers: Array(7).fill({ ailment: null }) as any,
    ability: defaultAbility,
  };

  const yangBullet: Bullet = {
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

  const yinBullet: Bullet = { ...yangBullet, yinYang: '陰気' };

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

  // サマーモンスター相当: 攻撃式条件・陽防4段階ダウン を useSimulation と同じロジックで適用
  function applyCardDebuff(buffs: BuffStages, stages: number): BuffStages {
    return {
      ...buffs,
      enemyYangDefR1: Math.max(-10, Math.min(10, buffs.enemyYangDefR1 - stages)),
    };
  }

  it('陽防4段階ダウンで敵防御力が下がりダメージが上昇する', () => {
    const buffsBase = createDefaultBuffStages();
    const buffsDebuffed = applyCardDebuff(buffsBase, 4);

    const dmgBase = calcSingleHitDamage(yangBullet, selfStats, enemyStats, buffsBase, false, '等倍', false, baseBonus);
    const dmgDebuffed = calcSingleHitDamage(yangBullet, selfStats, enemyStats, buffsDebuffed, false, '等倍', false, baseBonus);

    expect(dmgDebuffed).toBeGreaterThan(dmgBase);
  });

  it('絵札効果適用後の敵陽防R1が -4 になる', () => {
    const buffsBase = createDefaultBuffStages();
    const buffsDebuffed = applyCardDebuff(buffsBase, 4);
    expect(buffsDebuffed.enemyYangDefR1).toBe(-4);
  });

  it('既存デバフと合算してクランプされる (R1=-8 に -4 → -10 で頭打ち)', () => {
    const buffsBase = { ...createDefaultBuffStages(), enemyYangDefR1: -8 as number };
    const buffsDebuffed = applyCardDebuff(buffsBase, 4);
    expect(buffsDebuffed.enemyYangDefR1).toBe(-10);
  });

  it('陽防デバフは陰気弾のダメージに影響しない', () => {
    const buffsBase = createDefaultBuffStages();
    const buffsDebuffed = applyCardDebuff(buffsBase, 4);

    const dmgBase = calcSingleHitDamage(yinBullet, selfStats, enemyStats, buffsBase, false, '等倍', false, baseBonus);
    const dmgDebuffed = calcSingleHitDamage(yinBullet, selfStats, enemyStats, buffsDebuffed, false, '等倍', false, baseBonus);

    // 陽防デバフなので陰気弾には影響しない
    expect(dmgBase).toBe(dmgDebuffed);
  });
});
