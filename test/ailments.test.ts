import { describe, it, expect } from 'vitest';
import { getAilmentStacks, getAbilityBuffBonus, createDefaultBuffStages } from '@/lib/buffs';
import { calcAttackPower, calcEnemyDefense } from '@/lib/damage';
import { runSimulation } from '@/lib/simulation';
import type { BarrierStatus, AbilityConfig, SelfStats, Bullet, EnemyStats, SimulationConfig, BuffStages, EnemyWeaknessConfig, DamageBonus } from '@/types';
import { createDefaultAbilityConfig, createDefaultWeakness, createDefaultDamageBonus } from '@/types';

describe('結界異常ロジックの検証', () => {
  describe('getAilmentStacks (結界異常の集計)', () => {
    it('すべての異常を正しくカウントする', () => {
      const barriers: BarrierStatus[] = [
        { ailment: '燃焼' },
        { ailment: '燃焼' },
        { ailment: '凍結' },
        { ailment: null },
      ];
      const stacks = getAilmentStacks(barriers);
      expect(stacks.燃焼).toBe(2);
      expect(stacks.凍結).toBe(1);
      expect(stacks.帯電).toBe(0);
    });
  });

  describe('getAbilityBuffBonus (能力によるバフ変換)', () => {
    it('設定されたパターンに従ってバフ段階を算出する', () => {
      const ailments = { 燃焼: 2, 凍結: 1, 帯電: 0, 毒霧: 0, 暗闇: 0 };
      const ability: AbilityConfig = {
        convertAilments: [
          { ailment: '燃焼', pattern: '陽攻・陰攻・CRI攻撃・CRI命中' },
          { ailment: '凍結', pattern: '速力・命中・回避' },
        ],
        nullifyAilments: [],
      };
      const bonuses = getAbilityBuffBonus(ailments, ability);
      expect(bonuses['陽攻・陰攻・CRI攻撃・CRI命中']).toBe(2);
      expect(bonuses['速力・命中・回避']).toBe(1);
    });
  });

  describe('calcAttackPower (自身の結界異常と能力反映)', () => {
    const defaultStats: SelfStats = {
      yangAttack: 1000,
      yinAttack: 1000,
      speed: 1000,
      yangDefense: 1000,
      yinDefense: 1000,
      barriers: Array(5).fill({ ailment: null }) as any,
      ability: { convertAilments: [], nullifyAilments: [] },
      characterClass: 'なし',
    };
    const defaultBullet: Bullet = {
      id: 1, element: '星', yinYang: '陽気', bulletKind: '通常弾',
      power: 10, count: 1, hitRate: 100, criRate: 0,
      slashPercent: 0, hardPercent: 0, isPenetration: false, effects: []
    };
    const buffs = createDefaultBuffStages();

    it('能力がない場合、毒霧（自分）で陽攻が低下する', () => {
      const ailments = { 燃焼: 0, 凍結: 0, 帯電: 0, 毒霧: 1, 暗闇: 0 };
      const atk = calcAttackPower(defaultStats, buffs, defaultBullet, ailments);
      // 1000 * 0.875 = 875
      expect(atk).toBeCloseTo(875, 0);
    });

    it('毒霧をバフ変換対象にしている場合、デバフが無効化され、バフが加算される', () => {
      const stats = {
        ...defaultStats,
        ability: {
          convertAilments: [{ ailment: '毒霧', pattern: '陽攻・陰攻・CRI攻撃・CRI命中' }],
          nullifyAilments: [],
        }
      };
      const ailments = { 燃焼: 0, 凍結: 0, 帯電: 0, 毒霧: 2, 暗闇: 0 };
      const atk = calcAttackPower(stats, buffs, defaultBullet, ailments);
      // デバフ無効化 (1.0倍) + 陽攻バフ2段階 (1.6倍)
      // 1000 * 1.6 = 1600
      expect(atk).toBe(1600);
    });

    it('毒霧を無効化設定にしている場合、デバフが発生しない', () => {
      const stats = {
        ...defaultStats,
        ability: { convertAilments: [], nullifyAilments: ['毒霧'] }
      };
      const ailments = { 燃焼: 0, 凍結: 0, 帯電: 0, 毒霧: 3, 暗闇: 0 };
      const atk = calcAttackPower(stats, buffs, defaultBullet, ailments);
      expect(atk).toBe(1000);
    });
  });

  describe('calcEnemyDefense (敵の結界異常と能力反映)', () => {
    const defaultEnemy: EnemyStats = {
      yangDefense: 1000,
      yinDefense: 1000,
      hasBarriers: true,
      initialBarriers: 5,
      isFullBreak: false,
      barriers: Array(7).fill({ ailment: null }) as any,
      ability: { convertAilments: [], nullifyAilments: [] },
    };
    const bullet: Bullet = {
      id: 1, element: '星', yinYang: '陽気', bulletKind: '通常弾',
      power: 10, count: 1, hitRate: 100, criRate: 0,
      slashPercent: 0, hardPercent: 0, isPenetration: false, effects: []
    };
    const buffs = createDefaultBuffStages();

    it('能力がない場合、毒霧（敵）で陽防が低下する', () => {
      const ailments = { 燃焼: 0, 凍結: 0, 帯電: 0, 毒霧: 1, 暗闇: 0 };
      const def = calcEnemyDefense(defaultEnemy, buffs, bullet, ailments);
      expect(def).toBeCloseTo(875, 0);
    });

    it('敵が毒霧をバフ変換対象にしている場合、防御デバフが無効化され、防御バフが加算される', () => {
      const enemy = {
        ...defaultEnemy,
        ability: {
          convertAilments: [{ ailment: '毒霧', pattern: '陽防・陰防・CRI防御・CRI回避' }],
          nullifyAilments: [],
        }
      };
      const ailments = { 燃焼: 0, 凍結: 0, 帯電: 0, 毒霧: 2, 暗闇: 0 };
      const def = calcEnemyDefense(enemy, buffs, bullet, ailments);
      // デバフ無効化 (1.0倍) + 陽防バフ2段階 (1.6倍)
      expect(def).toBe(1600);
    });
  });

  describe('異常付与の動적ロジック (runSimulation)', () => {
    const defaultSelf: SelfStats = {
      yangAttack: 1000, yinAttack: 1000, speed: 1000, yangDefense: 1000, yinDefense: 1000,
      barriers: Array(5).fill({ ailment: null }) as any,
      ability: createDefaultAbilityConfig(),
      characterClass: 'なし',
    };
    const defaultEnemy: EnemyStats = {
      yangDefense: 1000, yinDefense: 1000, hasBarriers: true, initialBarriers: 3, isFullBreak: false,
      barriers: Array(7).fill({ ailment: null }) as any,
      ability: createDefaultAbilityConfig(),
    };
    const initialBuffs = createDefaultBuffStages();
    const weakness = createDefaultWeakness();
    const damageBonus = createDefaultDamageBonus();

    it('バレットの追加効果で敵に異常が付与され、既存の異常がシフトする', () => {
      const bullets: Bullet[] = [
        {
          id: 1, element: '星', yinYang: '陽気', bulletKind: '通常弾', power: 10, count: 1, hitRate: 100, criRate: 0,
          slashPercent: 0, hardPercent: 0, isPenetration: false,
          effects: [{ kind: '異常付与', ailmentType: '燃焼', target: 'enemy', probability: 100 }]
        },
        {
          id: 2, element: '星', yinYang: '陽気', bulletKind: '通常弾', power: 10, count: 1, hitRate: 100, criRate: 0,
          slashPercent: 0, hardPercent: 0, isPenetration: false,
          effects: [{ kind: '異常付与', ailmentType: '毒霧', target: 'enemy', probability: 100 }]
        }
      ];

      const config: SimulationConfig = {
        selfStats: defaultSelf,
        enemyStats: defaultEnemy,
        initialBuffs,
        bullets,
        hitOrder: [[1], [2]],
        isGirlReincarnation: false,
        enemyWeakness: weakness,
        specialAttackActive: {},
        damageBonus,
        activeBulletCount: 6,
      };

      const result = runSimulation(config);
      
      // 1ヒット目終了後: 燃焼が1枚付与されているはず
      expect(result.hitSequence[0].enemyAilments.燃焼).toBe(0); // ダメージ計算時はまだ0
      expect(result.hitSequence[1].enemyAilments.燃焼).toBe(1); // 2ヒット目の計算時は1枚ある
      
      const secondHit = result.hitSequence[1];
      expect(secondHit.enemyAilments.燃焼).toBe(1);
      expect(secondHit.enemyAilments.毒霧).toBe(0);
    });

    it('結界がフルになるとそれ以上付与されない', () => {
      const enemyWith1Barrier: EnemyStats = { ...defaultEnemy, initialBarriers: 1 };
      const bullets: Bullet[] = [
        {
          id: 1, element: '星', yinYang: '陽気', bulletKind: '通常弾', power: 10, count: 1, hitRate: 100, criRate: 0,
          slashPercent: 0, hardPercent: 0, isPenetration: false,
          effects: [
            { kind: '異常付与', ailmentType: '燃焼', target: 'enemy', probability: 100 },
            { kind: '異常付与', ailmentType: '毒霧', target: 'enemy', probability: 100 }
          ]
        },
        {
          id: 2, element: '星', yinYang: '陽気', bulletKind: '通常弾', power: 10, count: 1, hitRate: 100, criRate: 0,
          slashPercent: 0, hardPercent: 0, isPenetration: false,
          effects: []
        }
      ];

      const config: SimulationConfig = {
        selfStats: defaultSelf,
        enemyStats: enemyWith1Barrier,
        initialBuffs,
        bullets,
        hitOrder: [[1], [2]],
        isGirlReincarnation: false,
        enemyWeakness: weakness,
        specialAttackActive: {},
        damageBonus,
        activeBulletCount: 6,
      };

      const result = runSimulation(config);
      expect(result.hitSequence[1].enemyAilments.燃焼).toBe(1);
      expect(result.hitSequence[1].enemyAilments.毒霧).toBe(0);
    });
  });
});
