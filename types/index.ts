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
  | 'ミサイル弾';

export type ElementalAdvantage = '有利' | '等倍' | '不利';

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
  | '対象CRI回避低下';

export interface EffectMustHit {
  readonly kind: '必中';
}

export interface EffectSpecialAttack {
  readonly kind: '特効';
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
  effects: BulletEffect[];
}

// ============================================================
// ステータス
// ============================================================

export interface SelfStats {
  yangAttack: number; // 陽攻
  yinAttack: number; // 陰攻
  speed: number; // 速力
  yangDefense: number; // 陽防（硬質弾の攻撃力加算に使用）
  yinDefense: number; // 陰防（硬質弾の攻撃力加算に使用）
}

export interface EnemyStats {
  yangDefense: number; // 陽防（陽気弾の防御割り算に使用）
  yinDefense: number; // 陰防（陰気弾の防御割り算に使用）
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
  speedR1: number;      // -10〜10
  speedR2: number;
  selfYangDefR1: number;
  selfYangDefR2: number;
  selfYinDefR1: number;
  selfYinDefR2: number;

  // 命中（自身命中バフ + 敵回避デバフ combined）
  hitRateR1: number; // -10〜10
  hitRateR2: number;

  // CRI攻撃（自身バフ・R2 は自身のみ）
  selfCriAttackR1: number; // -10〜10
  selfCriAttackR2: number; // 0〜10（自身のみ）

  // CRI命中（自身バフ・R2 は自身のみ）
  selfCriHitR1: number; // -10〜10
  selfCriHitR2: number; // 0〜10（自身のみ）

  // ── 敵バフ/デバフ ──
  enemyYangDefR1: number; // -10〜10
  enemyYangDefR2: number;
  enemyYinDefR1: number;
  enemyYinDefR2: number;
  // 敵CRI防御バフ/デバフ（正=バフ=プレイヤーのCRI減衰、負=デバフ=CRI強化）
  enemyCriDefR1: number;      // -10〜10
  // 敵CRI回避バフ/デバフ（正=バフ=命中率低下、負=デバフ=命中率強化）
  enemyCriEvasionR1: number;  // -10〜10
}

// combined CRI攻撃 R1 = clamp(自身R1 − 敵CRI防御R1, -10, 10)
// 例: 自身6段 − 敵+3バフ = 3段
// 例: 自身3段 − 敵-5デバフ = 8段
// 例: 自身6段 − 敵+10バフ = -4段
export function combinedCriAttackR1(b: BuffStages): number {
  return Math.max(-10, Math.min(10, b.selfCriAttackR1 - b.enemyCriDefR1));
}
// combined CRI命中 R1 = clamp(自身R1 − 敵CRI回避R1, -10, 10)
export function combinedCriHitR1(b: BuffStages): number {
  return Math.max(-10, Math.min(10, b.selfCriHitR1 - b.enemyCriEvasionR1));
}

// ============================================================
// ヒット順
// ============================================================

export type HitGroup = number[]; // 1-based バレットID の配列（グループ内発射順）
export type HitOrder = HitGroup[];

// ============================================================
// 敵属性弱点設定
// 無属性は常に等倍固定なので設定対象外
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
// 蓄力同士は加算。合計倍率をダメージ計算式内で × (1 + totalChargeMult) として適用
// ============================================================

export interface ChargeSpirit {   // 蓄力[霊力]
  kind: '霊力';
  ratePerStack: number; // 整数 %、0以上（例: 100 = 100%/スタック）
  stacks: number;       // 0〜5
}

export interface ChargeBarrier {  // 蓄力[結界]
  kind: '結界';
  ratePerStack: number; // 整数 %、0以上
  stacks: number;       // 0〜5
}

export interface ChargeHP {       // 蓄力[体力]
  kind: '体力';
  maxRate: number;    // 最大倍率 整数 %、0以上（HP100%時の蓄力倍率）
  hpPercent: number;  // 現在の体力 整数 1〜100 (%)
}

export type ChargeEffect = ChargeSpirit | ChargeBarrier | ChargeHP;

/** 蓄力合計倍率（小数）を計算。加算方式。 */
export function calcTotalChargeMult(effects: ChargeEffect[]): number {
  return effects.reduce((sum, e) => {
    if (e.kind === '霊力' || e.kind === '結界') {
      return sum + (e.ratePerStack / 100) * e.stacks;
    }
    return sum + (e.maxRate / 100) * (e.hpPercent / 100);
  }, 0);
}

// 補正値設定
export interface DamageBonus {
  elementBonus: Partial<Record<Element, number>>;
  bulletKindBonus: Partial<Record<BulletKind, number>>;
  advantageBonus: number;
  disadvantageBonus: number;
  chargeEffects: ChargeEffect[]; // 蓄力リスト
}

export function createDefaultDamageBonus(): DamageBonus {
  return {
    elementBonus: {},
    bulletKindBonus: {},
    advantageBonus: 0,
    disadvantageBonus: 0,
    chargeEffects: [],
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
  expectedDamage: number; // 期待値ダメージ（命中率・CRI率を考慮）
  buffChanges: BuffChange[];
  buffStateAfter: BuffStages;
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
  // ヒット順シミュレーション期待値
  hitSequence: SingleHitResult[];
  totalSimDamage: number;

  // バレット単体静的期待値
  bulletStaticResults: BulletStaticResult[];
  totalStaticDamage: number;

  // 加重平均硬斬倍率
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
];
