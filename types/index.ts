// ============================================================
// 属性・弾種・基本列挙型
// ============================================================

export type Element =
  | '星'
  | '火'
  | '水'
  | '木'
  | '金'
  | '土'
  | '日'
  | '月'
  | '無';

export type YinYang = '陽気' | '陰気';

export type BulletKind =
  | '光弾'
  | 'レーザー弾'
  | 'エネルギー弾'
  | '質量弾'
  | '通常弾'
  | '斬撃弾'
  | '流体弾'
  | '御札弾'
  | 'ミサイル弾'
  | '肉弾';

export type ElementalAdvantage = '有利' | '等倍' | '不利';

export type CharacterClass =
  | '攻撃式'
  | '防御式'
  | '速攻式'
  | '支援式'
  | '妨害式'
  | '回復式'
  | '破壊式'
  | '技巧式';

// ============================================================
// 結界異常
// ============================================================

export type BarrierAilmentType = '燃焼' | '凍結' | '帯電' | '毒霧' | '暗闇';

export interface BarrierStatus {
  ailment: BarrierAilmentType | null;
}

// 敵は最大7枚、味方は最大5枚
export type EnemyBarriers = [
  BarrierStatus,
  BarrierStatus,
  BarrierStatus,
  BarrierStatus,
  BarrierStatus,
  BarrierStatus,
  BarrierStatus,
];
export type SelfBarriers = [
  BarrierStatus,
  BarrierStatus,
  BarrierStatus,
  BarrierStatus,
  BarrierStatus,
];

export function createEmptyBarriers<T extends number>(
  count: T,
): T extends 7 ? EnemyBarriers : SelfBarriers {
  return Array.from({ length: count }, () => ({ ailment: null })) as T extends 7
    ? EnemyBarriers
    : SelfBarriers;
}

// ============================================================
// 追加効果
// ============================================================

export type SelfBuffEffectType =
  | '自身陽攻上昇'
  | '自身陰攻上昇'
  | '自身速力上昇'
  | '自身陽防上昇'
  | '自身陰防上昇'
  | '自身命中上昇'
  | '自身CRI命中上昇';

export type EnemyDebuffEffectType =
  | '対象陽攻低下'
  | '対象陰攻低下'
  | '対象速力低下'
  | '対象陽防低下'
  | '対象陰防低下'
  | '対象CRI防御低下'
  | '対象CRI回避低下'
  | '対象回避低下';

export type BreakEffectType = '過毒' | '焼却' | '氷解' | '放電' | '閃光';

export type AilmentTarget = 'self' | 'enemy';

export interface EffectMustHit {
  readonly kind: '必中';
}

export interface EffectSpecialAttack {
  readonly kind: '特効';
}

export interface EffectElastic {
  readonly kind: '弾性弾';
}

export interface EffectExplosive {
  readonly kind: '爆破弾';
}

export interface EffectPrecision {
  readonly kind: '精密弾';
}

export interface EffectBreak {
  readonly kind: 'ブレイク';
  readonly breakType: BreakEffectType;
}

export interface EffectInflictAilment {
  readonly kind: '異常付与';
  readonly ailmentType: BarrierAilmentType;
  readonly target: AilmentTarget;
  readonly probability: number; // 0–100 (%)
}

export interface EffectSelfBuff {
  readonly kind: '自身バフ';
  readonly buffType: SelfBuffEffectType;
  readonly probability: number; // 0–100 (%)
  readonly stages: number;
}

export interface EffectEnemyDebuff {
  readonly kind: '対象デバフ';
  readonly debuffType: EnemyDebuffEffectType;
  readonly probability: number; // 0–100 (%)
  readonly stages: number;
}

export type BulletEffect =
  | EffectMustHit
  | EffectSpecialAttack
  | EffectElastic
  | EffectExplosive
  | EffectPrecision
  | EffectBreak
  | EffectInflictAilment
  | EffectSelfBuff
  | EffectEnemyDebuff;

// ============================================================
// バレット
// ============================================================

export interface Bullet {
  id: number;
  element: Element;
  yinYang: YinYang;
  bulletKind: BulletKind;
  power: number;
  count: number;
  hitRate: number; // 0–100 (%)
  criRate: number; // 0–100 (%)
  slashPercent: number; // 斬裂弾% (0=なし)
  hardPercent: number; // 硬質弾% (0=なし)
  isPenetration: boolean; // 貫通弾
  effects: BulletEffect[];
}

// ============================================================
// 絵札 (Story Card)
// ============================================================

export type StoryCardEffectKind =
  | '自身バフ'
  | '対象デバフ'
  | '属性ダメージUP'
  | '弾種ダメージUP'
  | '霊力上昇'
  | '結界増加'
  | 'ダメージ軽減';

export interface StoryCardEffect {
  kind: StoryCardEffectKind;
  target: string; // 例: '陽攻', '星', '光弾'
  value: number; // 段階 or %
  condition?: CharacterClass; // 特定の式の場合のみ発動。なしなら無条件。
}

export interface StoryCard {
  id: string;
  name: string;
  stats: {
    yangAttack?: number;
    yinAttack?: number;
    speed?: number;
    yangDefense?: number;
    yinDefense?: number;
  };
  effects: StoryCardEffect[];
}

// ============================================================
// 味方の能力 (Ability)
// ============================================================

export type AbilityBuffPattern =
  | '速力・命中・回避'
  | '陽攻・陰攻・CRI攻撃・CRI命中'
  | '陽防・陰防・CRI防御・CRI回避';

export interface AbilityConfig {
  // 結界異常をバフに変換する設定
  convertAilments: {
    ailment: BarrierAilmentType;
    pattern: AbilityBuffPattern;
  }[];
  // 結界異常を無効化する設定
  nullifyAilments: BarrierAilmentType[];
}

export function createDefaultAbilityConfig(): AbilityConfig {
  return {
    convertAilments: [],
    nullifyAilments: [],
  };
}

// ============================================================
// ステータス
// ============================================================

export interface SelfStats {
  yangAttack: number; // 陽攻
  yinAttack: number; // 陰攻
  speed: number; // 速力
  yangDefense: number; // 陽防
  yinDefense: number; // 陰防
  barriers: SelfBarriers;
  ability: AbilityConfig;
  characterClass: CharacterClass;
}

export interface EnemyStats {
  yangDefense: number; // 陽防
  yinDefense: number; // 陰防
  hasBarriers: boolean;
  initialBarriers: number; // 1-7
  isFullBreak: boolean; // 最初からフルブレイク状態か
  barriers: EnemyBarriers;
  ability: AbilityConfig;
}

// ============================================================
// バフ段階
// ============================================================

export interface BuffStages {
  // ── 自身バフ ──
  yangAttackR1: number; // -10〜10
  yangAttackR2: number; // 0〜10
  yinAttackR1: number;
  yinAttackR2: number;
  speedR1: number; // -10〜10
  speedR2: number;
  selfYangDefR1: number;
  selfYangDefR2: number;
  selfYinDefR1: number;
  selfYinDefR2: number;

  // 命中（自身バフ）
  selfHitR1: number; // -10〜10
  selfHitR2: number;

  // CRI攻撃（自身バフ・R2 は自身のみ）
  selfCriAttackR1: number; // -10〜10
  selfCriAttackR2: number; // 0〜10（自身のみ）

  // CRI命中（自身バフ・R2 は自身のみ）
  selfCriHitR1: number; // -10〜10
  selfCriHitR2: number; // 0〜10（自身のみ）

  // ── 敵バフ/デバフ ──
  enemyYangDefR1: number; // -10〜10
  enemyYangDefR2: number; // -10〜0 (デバフのみ)
  enemyYinDefR1: number;
  enemyYinDefR2: number;
  // 敵回避バフ/デバフ
  enemyEvasionR1: number; // -10〜10
  enemyEvasionR2: number; // -10〜0 (デバフのみ)
  // 敵CRI防御バフ/デバフ
  enemyCriDefR1: number; // -10〜10
  enemyCriDefR2: number; // -10〜0 (デバフのみ)
  // 敵CRI回避バフ/デバフ
  enemyCriEvasionR1: number; // -10〜10
  enemyCriEvasionR2: number; // -10〜0 (デバフのみ)
}

// combined 命中 R1 = clamp(自身R1 − 敵回避R1, -10, 10)
export function combinedHitRateR1(b: BuffStages): number {
  return Math.max(-10, Math.min(10, b.selfHitR1 - b.enemyEvasionR1));
}
// combined 命中 R2 = clamp(自身R2 − 敵回避R2, 0, 10)
export function combinedHitRateR2(b: BuffStages): number {
  return Math.max(0, Math.min(10, b.selfHitR2 - b.enemyEvasionR2));
}
// combined CRI攻撃 R1 = clamp(自身R1 − 敵CRI防御R1, -10, 10)
export function combinedCriAttackR1(b: BuffStages): number {
  return Math.max(-10, Math.min(10, b.selfCriAttackR1 - b.enemyCriDefR1));
}
// combined CRI攻撃 R2 = clamp(自身R2 − 敵CRI防御R2, 0, 10)
export function combinedCriAttackR2(b: BuffStages): number {
  return Math.max(0, Math.min(10, b.selfCriAttackR2 - b.enemyCriDefR2));
}
// combined CRI命中 R1 = clamp(自身R1 − 敵CRI回避R1, -10, 10)
export function combinedCriHitR1(b: BuffStages): number {
  return Math.max(-10, Math.min(10, b.selfCriHitR1 - b.enemyCriEvasionR1));
}
// combined CRI命中 R2 = clamp(自身R2 − 敵CRI回避R2, 0, 10)
export function combinedCriHitR2(b: BuffStages): number {
  return Math.max(0, Math.min(10, b.selfCriHitR2 - b.enemyCriEvasionR2));
}

// ============================================================
// ヒット順
// ============================================================

export type HitGroup = number[]; // 1-based バレットID の配列
export type HitOrder = HitGroup[];

// ============================================================
// 敵属性弱点設定
// ============================================================

export type ElementalElement = Exclude<Element, '無'>;
export type EnemyWeaknessConfig = Record<ElementalElement, ElementalAdvantage>;

export const ELEMENTAL_ELEMENTS: ElementalElement[] = [
  '日',
  '月',
  '火',
  '水',
  '木',
  '金',
  '土',
  '星',
];

export function getAdvantageForBullet(
  element: Element,
  weakness: EnemyWeaknessConfig,
): ElementalAdvantage {
  if (element === '無') return '等倍';
  return weakness[element];
}

export function createDefaultWeakness(): EnemyWeaknessConfig {
  return Object.fromEntries(
    ELEMENTAL_ELEMENTS.map((el) => [el, '等倍' as ElementalAdvantage]),
  ) as EnemyWeaknessConfig;
}

// ============================================================
// シミュレーション設定
// ============================================================

// ============================================================
// 蓄力（特殊バフ）
// ============================================================

export interface ChargeSpirit {
  kind: '霊力';
  ratePerStack: number;
  stacks: number;
}

export interface ChargeBarrier {
  kind: '結界';
  ratePerStack: number;
  stacks: number;
}

export interface ChargeHP {
  kind: '体力';
  maxRate: number;
  hpPercent: number;
}

export type ChargeEffect = ChargeSpirit | ChargeBarrier | ChargeHP;

export function calcTotalChargeMult(effects: ChargeEffect[]): number {
  return effects.reduce((sum, e) => {
    if (e.kind === '霊力' || e.kind === '結界') {
      return sum + (e.ratePerStack / 100) * e.stacks;
    }
    return sum + (e.maxRate / 100) * (e.hpPercent / 100);
  }, 0);
}

export interface DamageBonus {
  elementBonus: Partial<Record<Element, number>>;
  bulletKindBonus: Partial<Record<BulletKind, number>>;
  advantageBonus: number;
  disadvantageBonus: number;
  chargeEffects: ChargeEffect[];
  accumulationEffects: AccumulationEffect[];
  resonanceEffects: ResonanceEffect[];
  greatBarrier?: GreatBarrierConfig | null;
}

export type ResonanceKind =
  | 'ダメージアップ'
  | 'CRI時ダメージアップ'
  | '攻撃時CRI率'
  | '速力';

export interface ResonanceEffect {
  kind: ResonanceKind;
  value: number; // %
}

export type AccumulationTarget =
  | 'yangAttack'
  | 'yinAttack'
  | 'speed'
  | 'yangDefense'
  | 'yinDefense';

export interface AccumulationEffect {
  sourceStat: AccumulationTarget; // 元になるステータス
  targetStat: AccumulationTarget; // 上乗せ先のステータス
  sourceValue: number; // 元のステータスの数値
  rate: number; // 倍率 (%)
}

export function calcAccumulationValue(eff: AccumulationEffect): number {
  return Math.floor((eff.sourceValue * eff.rate) / 100);
}

// ============================================================
// 大結界（特殊バフ）
// ============================================================

export type GreatBarrierStatType =
  | '陽攻'
  | '陰攻'
  | '速力'
  | '陽防'
  | '陰防'
  | 'CRI攻撃/CRI防御'
  | '威力';

export type GreatBarrierDir = 'UP' | 'DOWN';

export interface GreatBarrierEntry {
  id: number;
  stat: GreatBarrierStatType;
  selfValue: number; // % (>= 0)
  selfDir: GreatBarrierDir; // 味方側の方向; 相手側は常に逆
  enemyValue: number; // % (>= 0)
}

export interface GreatBarrierConfig {
  entries: GreatBarrierEntry[];
}

export function createDefaultGreatBarrierConfig(): GreatBarrierConfig {
  return { entries: [] };
}

export function createDefaultDamageBonus(): DamageBonus {
  return {
    elementBonus: {},
    bulletKindBonus: {},
    advantageBonus: 0,
    disadvantageBonus: 0,
    chargeEffects: [],
    accumulationEffects: [],
    resonanceEffects: [],
    greatBarrier: null,
  };
}

export interface SimulationConfig {
  selfStats: SelfStats;
  enemyStats: EnemyStats;
  initialBuffs: BuffStages;
  bullets: Bullet[];
  hitOrder: HitOrder;
  isGirlReincarnation: boolean;
  enemyWeakness: EnemyWeaknessConfig;
  specialAttackActive: Record<number, boolean>;
  damageBonus: DamageBonus;
  activeBulletCount: number; // 使用する段数 (1-6)
}

// ============================================================
// ブースト関連
// ============================================================

export type BoostLevel = 0 | 1 | 2 | 3;

/** 代表的なブースト型リスト */
export const TYPICAL_BOOST_PATTERNS = [
  '1-3-1',
  '1-1-3',
  '2-2-1',
  '1-2-2',
  '2-1-2',
  '3-1-1',
] as const;

/**
 * ブースト構成（例: "1-3-1"）を検証する
 * 合計が5 (0bの1段と合わせて全6段) になる必要がある
 */
export function validateBoostPattern(pattern: string): string | null {
  const parts = pattern.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return 'ブースト型は "1-3-1" のような形式で入力してください。';
  }
  const total = parts.reduce((a, b) => a + b, 0);
  if (total !== 5) {
    return `ブースト追加段数の合計は 5 である必要があります（現在の合計: ${total}）。`;
  }
  return null;
}

/**
 * ブースト構成（例: "1-3-1"）から各ブースト段階での発動段数を計算する
 */
export function getActiveCountFromBoost(
  pattern: string,
  level: BoostLevel,
): number {
  if (level === 0) return 1;

  const parts = pattern.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return level + 1; // フォールバック: 0b=1, 1b=2, 2b=3, 3b=4
  }

  const [b1, b2, b3] = parts;
  if (level === 1) return 1 + b1;
  if (level === 2) return 1 + b1 + b2;
  return 1 + b1 + b2 + b3;
}

// ============================================================
// シミュレーション結果
// ============================================================

export interface BuffChange {
  field: keyof BuffStages;
  delta: number;
  newValue: number;
  label: string;
}

export interface SingleHitResult {
  sequenceIndex: number;
  bulletId: number;
  elementalAdvantage: ElementalAdvantage;
  mustHit: boolean;
  specialAttack: boolean;
  expectedDamage: number;
  buffChanges: BuffChange[];
  buffStateBefore: BuffStages;
  buffStateAfter: BuffStages;
  barriersRemaining: number;
  isFullBreakBefore: boolean;
  isFullBreak: boolean;
  // 追加: 結界異常枚数
  enemyAilments: Record<BarrierAilmentType, number>;
  selfAilments: Record<BarrierAilmentType, number>;
}

export interface BulletStaticResult {
  bulletId: number;
  advantage: ElementalAdvantage;
  expectedDamage: number;
}

export interface WeightedMultipliers {
  slash: number;
  hard: number;
}

export interface SimulationResult {
  hitSequence: SingleHitResult[];
  totalSimDamage: number;
  bulletSimResults: BulletStaticResult[];
  bulletStaticResults: BulletStaticResult[];
  totalStaticDamage: number;
  weightedMultipliers: WeightedMultipliers;
}

// ============================================================
// UI用ユーティリティ型
// ============================================================

export const ALL_ELEMENTS: Element[] = [
  '星',
  '火',
  '水',
  '木',
  '金',
  '土',
  '日',
  '月',
  '無',
];
export const ALL_BULLET_KINDS: BulletKind[] = [
  '光弾',
  'レーザー弾',
  'エネルギー弾',
  '質量弾',
  '通常弾',
  '斬撃弾',
  '流体弾',
  '御札弾',
  'ミサイル弾',
  '肉弾',
];

export const ALL_ELEMENTAL_ADVANTAGES: ElementalAdvantage[] = [
  '有利',
  '等倍',
  '不利',
];

export const SELF_BUFF_EFFECT_TYPES: SelfBuffEffectType[] = [
  '自身陽攻上昇',
  '自身陰攻上昇',
  '自身速力上昇',
  '自身陽防上昇',
  '自身陰防上昇',
  '自身命中上昇',
  '自身CRI命中上昇',
];

export const ENEMY_DEBUFF_EFFECT_TYPES: EnemyDebuffEffectType[] = [
  '対象陽攻低下',
  '対象陰攻低下',
  '対象速力低下',
  '対象陽防低下',
  '対象陰防低下',
  '対象CRI防御低下',
  '対象CRI回避低下',
  '対象回避低下',
];
