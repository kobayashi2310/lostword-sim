# データ構造仕様書 (types フォルダ)

このプロジェクトで使用されている主要な TypeScript の型定義とデータ構造についてまとめます。

## 1. 基本列挙型・ユニオン型

| 型名 | 定義内容 | 説明 |
| :--- | :--- | :--- |
| `Element` | `'星' \| '火' \| '水' \| '木' \| '金' \| '土' \| '日' \| '月' \| '無'` | 各バレットの属性。 |
| `YinYang` | `'陽気' \| '陰気'` | バレットの攻撃属性。 |
| `BulletKind` | `'光弾' \| 'レーザー弾' \| ... \| 'ミサイル弾'` | バレットの種類（9種類）。弾種補正の対象。 |
| `ElementalAdvantage`| `'有利' \| '等倍' \| '不利'` | 属性相性の結果。 |

## 2. バレット関連 (Bullet & Effects)

### `Bullet` インターフェース
個別のバレット段のステータスを定義します。

- `id`: number (1〜6)
- `element`: Element
- `yinYang`: YinYang
- `bulletKind`: BulletKind
- `power`: number (威力)
- `count`: number (弾数)
- `hitRate`: number (基礎命中率 0-100)
- `criRate`: number (基礎CRI率 0-100)
- `slashPercent`: number (斬裂倍率 %)
- `hardPercent`: number (硬質倍率 %)
- `effects`: `BulletEffect[]` (追加効果のリスト)

### `BulletEffect` (Discriminated Union)
バレットが持つ特殊能力やバフ・デバフ効果。

| kind | 追加プロパティ | 説明 |
| :--- | :--- | :--- |
| `'必中'` | - | 命中率を100%として計算。 |
| `'特効'` | - | 特効対象（CRI率100%）かどうかの判定対象。 |
| `'自身バフ'` | `buffType`, `probability`, `stages` | 攻撃後に自身に付与されるバフ。 |
| `'対象デバフ'` | `debuffType`, `probability`, `stages` | 攻撃後に対象に付与されるデバフ。 |

## 3. ステータス・バフ関連

### `SelfStats` / `EnemyStats`
- **SelfStats**: 陽攻, 陰攻, 速力, 陽防, 陰防
- **EnemyStats**: 陽防, 陰防

### `BuffStages`
全バフ項目の段階を保持するオブジェクト。
- 各項目に対し `R1` (通常バフ: -10〜10) と `R2` (特殊バフ: 0〜10) が存在します。
- 命中、CRI攻撃、CRI命中などは 0〜10 の範囲で管理。ただし敵の回避/CRI防御/CRI回避との合算結果は -10〜10 の範囲となり、負の場合は減衰効果が発生する。

## 4. 特殊補正 (DamageBonus)

### `ChargeEffect` (蓄力)
- **霊力/結界**: `ratePerStack` × `stacks`
- **体力**: `maxRate` × `hpPercent` / 100
- 蓄力同士は加算され、最終ダメージに `(1 + 合計倍率)` として乗算されます。

### `DamageBonus`
- `elementBonus`: 属性ダメージUP (%)
- `bulletKindBonus`: 弾種ダメージUP (%)
- `advantageBonus` / `disadvantageBonus`: 相性補正の強化 (%)
- `chargeEffects`: 蓄力効果のリスト

## 5. シミュレーション結果 (SimulationResult)

シミュレーション実行後に返される構造です。

- `hitSequence`: `SingleHitResult[]` (ヒットごとのダメージとバフ変化の履歴)
- `totalSimDamage`: ヒット順を考慮した合計期待値
- `bulletStaticResults`: 各バレット段ごとの単体期待値 (初期バフ固定)
- `totalStaticDamage`: 静的な合計期待値
- `weightedMultipliers`: 全体の加重平均（斬裂・硬質）

## 6. ヒット順 (HitOrder)
`type HitOrder = number[][]`
- `number[]` は同時にヒットするグループ（バレットIDの配列）。
- グループが順番に並んだ二次元配列として定義。
