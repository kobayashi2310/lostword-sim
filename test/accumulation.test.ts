import { describe, it, expect } from 'vitest';
import { calcAttackPower } from '@/lib/damage';
import { createDefaultBuffStages } from '@/lib/buffs';
import { createDefaultAbilityConfig, createDefaultDamageBonus } from '@/types';
import type { SelfStats, Bullet, DamageBonus, BuffStages } from '@/types';

describe('蓄積バフの計算検証', () => {
  const defaultStats: SelfStats = {
    yangAttack: 2000,
    yinAttack: 2000,
    speed: 1650, // デフォルト速力
    yangDefense: 1000,
    yinDefense: 1000,
    barriers: Array(5).fill({ ailment: null }) as any,
    ability: createDefaultAbilityConfig(),
    characterClass: 'なし',
  };

  const slashBullet: Bullet = {
    id: 1, element: '星', yinYang: '陽気', bulletKind: '通常弾',
    power: 10, count: 1, hitRate: 100, criRate: 0,
    slashPercent: 100, // 斬裂100% (速力がそのまま加算される設定)
    hardPercent: 0, isPenetration: false, effects: []
  };

  it('蓄積値がバフ倍率の適用前に加算されていること', () => {
    // 条件: 速力1650 + 蓄積800、さらに速力バフ2段階(+60% = 1.6倍)
    const buffs: BuffStages = {
      ...createDefaultBuffStages(),
      speedR1: 2, // +2段階
    };

    const damageBonus: DamageBonus = {
      ...createDefaultDamageBonus(),
      accumulationEffects: [
        { sourceStat: 'speed', targetStat: 'speed', sourceValue: 1600, rate: 50 } // 1600の50% = 800加算
      ]
    };

    // 期待値の計算プロセス:
    // 1. 基礎速力 = 1650 + 800 = 2450
    // 2. バフ後速力 = 2450 * 1.6 = 3920
    // 3. 斬裂成分 = 3920 * 100% = 3920
    // 4. 最終攻撃力 = 陽攻2000(無バフ) + 斬裂3920 = 5920
    
    const atk = calcAttackPower(defaultStats, buffs, slashBullet, { 燃焼: 0, 凍結: 0, 帯電: 0, 毒霧: 0, 暗闇: 0 }, damageBonus);
    
    expect(atk).toBe(5920);
  });

  it('複数の蓄積が合算されること', () => {
    const damageBonus: DamageBonus = {
      ...createDefaultDamageBonus(),
      accumulationEffects: [
        { sourceStat: 'speed', targetStat: 'yangAttack', sourceValue: 1000, rate: 10 }, // +100
        { sourceStat: 'speed', targetStat: 'yangAttack', sourceValue: 1000, rate: 20 }, // +200
      ]
    };
    const buffs = createDefaultBuffStages();
    // 陽攻 2000 + 100 + 200 = 2300
    const atk = calcAttackPower(defaultStats, buffs, slashBullet, { 燃焼: 0, 凍結: 0, 帯電: 0, 毒霧: 0, 暗闇: 0 }, damageBonus);
    // 斬裂100%で速力1650が足されるので 2300 + 1650 = 3950
    expect(atk).toBe(3950);
  });
});
