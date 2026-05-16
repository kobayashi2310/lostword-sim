import type { Bullet, EnemyStats, HitOrder, SelfStats } from '@/types';
import { createDefaultBuffStages } from './buffs';
import { serializeHitOrder } from './simulation';
import { createEmptyBarriers, createDefaultAbilityConfig } from '@/types';

// 仕様書サンプルデータ
export const DEFAULT_SELF_STATS: SelfStats = {
  yangAttack: 2000,
  yinAttack: 1350,
  speed: 1650,
  yangDefense: 1000,
  yinDefense: 1000,
  barriers: createEmptyBarriers(5),
  ability: {
    convertAilments: [
      { ailment: '凍結', pattern: '速力・命中・回避' },
      { ailment: '帯電', pattern: '速力・命中・回避' },
    ],
    nullifyAilments: ['毒霧', '暗闇'],
  },
  characterClass: '攻撃式',
};

export const DEFAULT_ENEMY_STATS: EnemyStats = {
  yangDefense: 5000,
  yinDefense: 5000,
  hasBarriers: true,
  initialBarriers: 5,
  isFullBreak: false,
  barriers: createEmptyBarriers(7),
  ability: createDefaultAbilityConfig(),
};

export const DEFAULT_BUFF_STAGES = createDefaultBuffStages();

export const DEFAULT_BULLETS: Bullet[] = [
  {
    id: 1,
    element: '星',
    yinYang: '陽気',
    bulletKind: 'レーザー弾',
    power: 4.17,
    count: 18,
    hitRate: 80,
    criRate: 15,
    slashPercent: 160,
    hardPercent: 0,
    isPenetration: false,
    effects: [
      { kind: '必中' },
      { kind: '特効' },
      {
        kind: '自身バフ',
        buffType: '自身陽攻上昇',
        probability: 100,
        stages: 2,
      },
      {
        kind: '自身バフ',
        buffType: '自身命中上昇',
        probability: 100,
        stages: 1,
      },
    ],
  },
  {
    id: 2,
    element: '火',
    yinYang: '陽気',
    bulletKind: 'レーザー弾',
    power: 7.51,
    count: 3,
    hitRate: 80,
    criRate: 15,
    slashPercent: 120,
    hardPercent: 0,
    isPenetration: false,
    effects: [{ kind: '必中' }],
  },
  {
    id: 3,
    element: '火',
    yinYang: '陽気',
    bulletKind: 'レーザー弾',
    power: 11.27,
    count: 2,
    hitRate: 80,
    criRate: 15,
    slashPercent: 0,
    hardPercent: 0,
    isPenetration: false,
    effects: [],
  },
  {
    id: 4,
    element: '星',
    yinYang: '陰気',
    bulletKind: 'レーザー弾',
    power: 11.27,
    count: 2,
    hitRate: 80,
    criRate: 15,
    slashPercent: 120,
    hardPercent: 0,
    isPenetration: false,
    effects: [
      { kind: '特効' },
      {
        kind: '対象デバフ',
        debuffType: '対象CRI防御低下',
        probability: 100,
        stages: 1,
      },
    ],
  },
  {
    id: 5,
    element: '火',
    yinYang: '陽気',
    bulletKind: 'レーザー弾',
    power: 22.54,
    count: 1,
    hitRate: 80,
    criRate: 15,
    slashPercent: 0,
    hardPercent: 0,
    isPenetration: false,
    effects: [],
  },
  {
    id: 6,
    element: '星',
    yinYang: '陽気',
    bulletKind: 'レーザー弾',
    power: 22.54,
    count: 1,
    hitRate: 80,
    criRate: 15,
    slashPercent: 160,
    hardPercent: 0,
    isPenetration: false,
    effects: [
      { kind: '必中' },
      { kind: '特効' },
      {
        kind: '自身バフ',
        buffType: '自身CRI命中上昇',
        probability: 100,
        stages: 1,
      },
    ],
  },
];

// 仕様書のヒット順
export const DEFAULT_HIT_ORDER: HitOrder = [
  [1],
  [1, 2],
  [1],
  [1, 2],
  [1],
  [1, 3],
  [1],
  [1, 4],
  [1],
  [1, 2],
  [1],
  [1, 3],
  [1],
  [1, 4],
  [1],
  [1, 5],
  [1],
  [1, 6],
];

export const DEFAULT_HIT_ORDER_TEXT = serializeHitOrder(DEFAULT_HIT_ORDER);
