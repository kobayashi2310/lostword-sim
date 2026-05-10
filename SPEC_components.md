# コンポーネント仕様書 (components フォルダ)

このプロジェクトで使用されている各コンポーネントの役割、Props、および再利用性についてまとめます。すべてのコンポーネントは `"use client"` であり、クライアントサイドでのインタラクションを担当します。

## 1. Buffs (バフ関連)

| コンポーネント | 役割 | 主な Props | 再利用性 |
| :--- | :--- | :--- | :--- |
| `BuffRankInput.tsx` | R1（通常バフ）と R2（特殊バフ）の段階を入力するための汎用的な数値入力セット。 | `label`, `r1`, `r2`, `onChangeR1`, `onChangeR2`, `r1Min`, `r1Max` | **高**: 他の数値段階入力にも流用可能。 |
| `AllBuffsPanel.tsx` | 攻撃、速力、防御、命中、CRI関連の全バフ段階入力をまとめたパネル。 | `buffs: BuffStages`, `onChange` | **低**: `BuffStages` 型に依存。 |

## 2. Bullets (バレット関連)

| コンポーネント | 役割 | 主な Props | 再利用性 |
| :--- | :--- | :--- | :--- |
| `EffectsInput.tsx` | バレットに付与する追加効果（必中、特効、自身バフ、対象デバフ）を動的に追加・削除・編集する。 | `effects: BulletEffect[]`, `onChange` | **中**: 追加効果のロジックをカプセル化。 |
| `BulletForm.tsx` | 個別のバレット設定（属性、威力、弾数、命中、斬裂/硬質など）を行う。折りたたみ可能。 | `bullet: Bullet`, `onChange` | **低**: `Bullet` 型に依存。 |
| `BulletListForm.tsx` | `BulletForm` をリスト表示し、複数のバレットを管理する。 | `bullets: Bullet[]`, `onChange` | **低**: バレットリスト専用。 |

## 3. HitOrder (ヒット順)

| コンポーネント | 役割 | 主な Props | 再利用性 |
| :--- | :--- | :--- | :--- |
| `HitOrderInput.tsx` | バレットのヒット順をテキスト形式で入力・編集する。パース結果の要約も表示。 | `text: string`, `onChange` | **中**: 特殊なパースを伴うテキスト入力。 |

## 4. Stats (ステータス・補正関連)

| コンポーネント | 役割 | 主な Props | 再利用性 |
| :--- | :--- | :--- | :--- |
| `SelfStatsInput.tsx` | 自身の基本ステータス（陽攻、陰攻、速力、防御）の入力。 | `stats: SelfStats`, `onChange` | **低**: `SelfStats` 型に依存。 |
| `EnemyStatsInput.tsx` | 敵の基本ステータス（陽防、陰防）の入力。 | `stats: EnemyStats`, `onChange` | **低**: `EnemyStats` 型に依存。 |
| `EnemyWeaknessInput.tsx` | 敵の各属性に対する耐性（有利・等倍・不利）をボタン選択で設定。 | `weakness: EnemyWeaknessConfig`, `onChange` | **低**: 属性相性システムに特化。 |
| `DamageBonusInput.tsx` | 有利/不利補正、属性ダメージUP、弾種ダメージUPの設定。 | `bullets`, `damageBonus`, `onChange` | **低**: 補正値計算システムに依存。 |
| `SpecialBuffInput.tsx` | 蓄力、共鳴、蓄積といった特殊なバフ項目を統合して管理する親コンポーネント。 | `damageBonus`, `onChange` | **低**: 特殊バフシステム全体に依存。 |
| `ChargeBuffSection.tsx` | 蓄力（霊力、結界、体力）の個別設定を行う。 | `effects`, `onChange` | **中**: 蓄力ロジックを独立。 |
| `ResonanceBuffSection.tsx` | 共鳴（ダメージアップ、CRIダメUP等）の設定を行う。 | `effects`, `onChange` | **中**: 共鳴ロジックを独立。 |
| `AccumulationBuffSection.tsx` | 蓄積バフ（ステータス加算）の設定を行う。同一ペアの重複防止ロジックを含む。 | `effects`, `onChange` | **中**: 蓄積ロジックを独立。 |

## 5. Results (計算結果・グラフ)

| コンポーネント | 役割 | 主な Props | 再利用性 |
| :--- | :--- | :--- | :--- |
| `DamageCharts.tsx` | `recharts` を用いたダメージ分布グラフ。バレット別期待値とヒット順ダメージ推移を表示。 | `bulletStaticResults`, `hitSequence`, `totalDamage` | **中**: データの可視化。 |
| `SimulationResults.tsx` | 計算結果のサマリー、グラフ、詳細テーブル、および結果に対する動的な調整（特効ON/OFF等）をまとめた表示パネル。 | `result`, `bullets`, `enemyWeakness`, `specialAttackActive`, `onWeaknessChange`, `onSpecialAttackChange` | **低**: 計算結果の構造に密結合。 |

---

## 設計上の共通パターン
- **Controlled Components**: ほとんどのコンポーネントが `value/onChange` パターンを採用しており、状態は親（主に `app/page.tsx`）で一元管理されています。
- **Atomic Design の傾向**: `BuffRankInput` や `StatRow` (SelfStatsInput内) のような小さなパーツを組み合わせて複雑なフォームを構成しています。
- **Styling**: Tailwind CSS を使用し、ライト/ダークモードの両方に対応しています。
