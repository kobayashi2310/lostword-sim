# Logic Snapshot — 東方LW ダメージ計算シミュレーター

> このファイル単体で計算ロジックを再実装・検証できることを目的とする。

---

## 1. Core Math Formulas

### 1.1 攻撃力 (Attack Power)

陰陽によって参照するステータスが異なる。

**陽気バレット:**

$$\text{ATK} = (\text{yangAttack} \times M^{atk}_{yang}) + (\text{speed} \times M^{spd} \times \frac{\text{slashPercent}}{100}) + (\text{yangDefense} \times M^{def}_{selfYang} \times \frac{\text{hardPercent}}{100})$$

**陰気バレット:**

$$\text{ATK} = (\text{yinAttack} \times M^{atk}_{yin}) + (\text{speed} \times M^{spd} \times \frac{\text{slashPercent}}{100}) + (\text{yinDefense} \times M^{def}_{selfYin} \times \frac{\text{hardPercent}}{100})$$

- `slashPercent = 0` のとき斬裂成分は 0、`hardPercent = 0` のとき硬質成分は 0。
- 斬裂・硬質は同一バレットに**同時設定可能**（両方 > 0 の場合は両方加算）。
- 各 $M$ はバフ倍率（§2 参照）。

### 1.2 敵防御力 (Enemy Defense)

$$\text{DEF}_{yang} = \text{yangDefense}_{enemy} \times M^{def}_{enemyYang}$$
$$\text{DEF}_{yin}  = \text{yinDefense}_{enemy}  \times M^{def}_{enemyYin}$$

陽気バレットは $\text{DEF}_{yang}$、陰気バレットは $\text{DEF}_{yin}$ を使用。

### 1.3 1発ダメージ（切り捨て）

$$D = \lfloor \text{power} \times \frac{\text{ATK}}{\text{DEF}} \times \text{baseFactor} \times 0.4 \times E \times C \times (1 + B_e + B_k) \rfloor$$

| 変数 | 定義 |
|------|------|
| $\text{baseFactor}$ | 通常 = 100、少女転生後 = 140 |
| $E$ | 属性相性倍率（§4 参照） |
| $C$ | クリティカル補正（§2.3 参照）、非CRI時 = 1 |
| $B_e$ | 属性ダメージアップ率（そのバレットの属性に設定された値 / 100）、未設定 = 0 |
| $B_k$ | 弾種ダメージアップ率（そのバレットの弾種に設定された値 / 100）、未設定 = 0 |

**加算仕様例：**
- 星属性50%UP かつ レーザー弾50%UP → $(1 + 0.5 + 0.5) = 2.0$
- 火属性（0%UP）かつ レーザー弾50%UP → $(1 + 0 + 0.5) = 1.5$
- 無属性は属性相性が等倍固定だが、属性ダメージアップ補正は設定可能

### 1.4 期待値ダメージ（1発分）

$$D_{ncrit} = \lfloor D \text{ with } C=1 \rfloor$$
$$D_{crit}  = \lfloor D \text{ with } C=C_{crit} \rfloor$$
$$D_{expected} = \lfloor (D_{ncrit} \times (1 - r_{cri}) + D_{crit} \times r_{cri}) \times r_{hit} \rfloor$$

- $r_{cri} = \text{effectiveCriRate} / 100$（特効発動時は $r_{cri} = 1.0$）
- $r_{hit} = \text{effectiveHitRate} / 100$（必中時は $r_{hit} = 1.0$）
- **切り捨ての順序が仕様**：非CRI・CRI をそれぞれ切り捨て → CRI率で合算 → 命中率で切り捨て。

### 1.5 段ごとの合計期待値

$$D_{stage} = D_{expected} \times \text{count}$$

---

## 2. Buff & Multiplier Rules

### 2.1 攻撃・防御・速力系（$M_{ads}$）

$$M_{ads}(n) = \begin{cases} 1 + 0.3|n| & (n > 0) \\ 1 & (n = 0) \\ \dfrac{1}{1 + 0.3|n|} & (n < 0) \end{cases}$$

Rank1 と Rank2 は**乗算**で合成：

$$M = M_{ads}(R1) \times M_{ads}(R2)$$

> 例：陽攻R1=+5, R2=+2 → $(1+1.5) \times (1+0.6) = 2.5 \times 1.6 = 4.0$

### 2.2 命中・CRI命中系（$M_{hit}$）

$$M_{hit}(n) = 1 + 0.2 \times \max(0, n)$$

R1・R2 を乗算で合成（負値なし）。実効値は 100% でキャップ。

$$\text{effectiveHitRate} = \min(\text{baseHitRate} \times M_{hit}(R1) \times M_{hit}(R2),\ 100)$$
$$\text{effectiveCriRate} = \min(\text{baseCriRate} \times M_{hit}(R1_{criHit}) \times M_{hit}(R2_{criHit}),\ 100)$$

### 2.3 クリティカル補正（$C_{crit}$）

$$C_{crit} = 1 + 1.0 \times (1 + 0.3 \times R1_{criAtk}) \times (1 + 0.3 \times R2_{criAtk})$$

- 基底は +100%（× 2.0）。
- `criAttackR1` は「自身CRI攻撃バフ + 敵CRI防御デバフ」の**合算値**として管理。
- `criAttackR2` は独立して乗算。

> 例：R1=0, R2=0 → $C = 1 + 1 \times 1 \times 1 = 2.0$  
> 例：R1=5, R2=0 → $C = 1 + 1 \times 2.5 \times 1 = 3.5$

### 2.4 バフ段階のクランプ規則

| グループ | フィールド | 有効範囲 |
|----------|-----------|----------|
| 攻撃/防御系 R1 | yangAttackR1, yinAttackR1, selfYangDefR1, selfYinDefR1, enemyYangDefR1, enemyYinDefR1 | −10 〜 +10 |
| 速力 R1 | speedR1 | 0 〜 +10 |
| 全 R2 | *.R2 | 0 〜 +10 |
| 命中/CRI系 R1 | hitRateR1, criAttackR1, criHitR1 | 0 〜 +10 |

追加効果による加算後に clamp。整数に丸める（`Math.round`）。

---

## 3. Simulation Logic

### 3.1 `runHitOrderSimulation` — 処理フロー

```
入力: config (Stats, Buffs初期値, Bullets, HitOrder, ...)
出力: hitSequence[], totalSimDamage

currentBuffs = initialBuffs
effectFiredSet = {}  // 追加効果を発動済みのバレットIDセット

for group in hitOrder:           // グループ = 同一ステップで発射される弾のセット
  for bulletId in group:         // グループ内は左→右の順に処理
    bullet = bullets[bulletId]
    advantage = enemyWeakness[bullet.element]   // '無' なら常に等倍
    mustHit   = bullet.effects に '必中' あり
    specialAtk = bullet.effects に '特効' あり AND specialAttackActive[bulletId]

    expectedDamage = calcExpectedSingleHitDamage(bullet, currentBuffs, ...)
    totalSimDamage += expectedDamage

    // 追加効果: 各バレット段につき「初ヒット時のみ1回」発動
    if bulletId NOT in effectFiredSet:
      effectFiredSet.add(bulletId)
      currentBuffs = applyBulletEffects(currentBuffs, bullet.effects)
      // 発動する効果: 自身バフ・対象デバフのみ（必中・特効は無視）

    record SingleHitResult(expectedDamage, buffChanges, buffStateAfter, ...)
```

### 3.2 追加効果の発動ルール

| 条件 | 動作 |
|------|------|
| `effectFiredSet` に未登録 | 効果を全件適用し、`effectFiredSet` に追加 |
| `effectFiredSet` に登録済 | 効果をスキップ（同じバレットの2発目以降） |
| 確率（probability）の扱い | **現状 100% 前提**（prob 値は保存されるが発動チェックなし） |
| '必中' / '特効' | バフ段階変化なし（ダメージ計算パラメータにのみ影響） |

### 3.3 追加効果 → BuffStages フィールドへのマッピング

| 追加効果種別 | 対象フィールド | 演算 |
|-------------|--------------|------|
| 自身陽攻上昇 | yangAttackR1 | clampR1(+stages) |
| 自身陰攻上昇 | yinAttackR1 | clampR1(+stages) |
| 自身速力上昇 | speedR1 | clampHitCri(+stages) |
| 自身陽防上昇 | selfYangDefR1 | clampR1(+stages) |
| 自身陰防上昇 | selfYinDefR1 | clampR1(+stages) |
| 自身命中上昇 | hitRateR1 | clampHitCri(+stages) |
| 自身CRI命中上昇 | criHitR1 | clampHitCri(+stages) |
| 対象陽防低下 | enemyYangDefR1 | clampR1(−stages) |
| 対象陰防低下 | enemyYinDefR1 | clampR1(−stages) |
| 対象CRI防御低下 | criAttackR1 | clampHitCri(+stages) |
| 対象CRI回避低下 | criHitR1 | clampHitCri(+stages) |
| 対象陽攻低下 | なし | 敵の攻撃力はこちらの与ダメに無影響。弾性弾仕様確定後に実装予定 |
| 対象陰攻低下 | なし | 同上 |
| 対象速力低下 | なし | 同上 |

### 3.4 `runStaticBulletCalculation` との違い

| 項目 | Static | Simulation |
|------|--------|------------|
| バフ状態 | `initialBuffs` 固定（ヒット中に変化しない） | `currentBuffs` が動的に更新 |
| 集計単位 | 1バレット段 = `D_expected × count` | 1発ごとに集計 |
| 用途 | 各バレット寄与の比較 | バフ発動タイミングの影響を含む総合値 |

---

## 4. Data Constants

### 4.1 baseFactor

| 条件 | 値 |
|------|----|
| 通常（少女転生なし） | 100 |
| 少女転生後 | 140 |

### 4.2 属性相性倍率 $E$

| 設定 | 倍率 |
|------|------|
| 有利 | $2.0 \times (1 + \text{advantageBonus}/100)$ |
| 等倍 | 1.0（補正なし） |
| 不利 | $0.5 \times (1 + \text{disadvantageBonus}/100)$ |
| 無属性（`element = '無'`） | 常に等倍 = 1.0 |

- `advantageBonus`（有利補正）: 有利属性ダメージアップ % → 40%で×2.8
- `disadvantageBonus`（不利補正）: 不利属性ダメージアップ % → 40%で×0.7
- デフォルト両方 0（補正なし）

属性弱点は**属性ごとに個別設定**（`EnemyWeaknessConfig`）。  
`'無'` の要素は設定対象外で常に 1.0 が適用される。

### 4.3 加重平均硬斬倍率

$$\text{slash}_{weighted} = \frac{\sum_{i} (\text{power}_i \times \text{count}_i \times \frac{\text{slashPercent}_i}{100})}{\sum_{i} (\text{power}_i \times \text{count}_i)}$$

$$\text{hard}_{weighted} = \frac{\sum_{i} (\text{power}_i \times \text{count}_i \times \frac{\text{hardPercent}_i}{100})}{\sum_{i} (\text{power}_i \times \text{count}_i)}$$

分母 = 0 のとき両値 = 0。

---

## 5. BuffStages フィールド対応表

| フィールド | 範囲 | 寄与する計算 |
|-----------|------|------------|
| `yangAttackR1` / `R2` | R1: −10〜+10 / R2: 0〜+10 | 陽気バレットの ATK（陽攻ステ倍率） |
| `yinAttackR1` / `R2` | 同上 | 陰気バレットの ATK（陰攻ステ倍率） |
| `speedR1` / `R2` | 0〜+10 | 全バレットの ATK（速力ステ × 斬裂%の倍率） |
| `selfYangDefR1` / `R2` | −10〜+10 / 0〜+10 | 陽気バレットの ATK（自身陽防ステ × 硬質%の倍率） |
| `selfYinDefR1` / `R2` | 同上 | 陰気バレットの ATK（自身陰防ステ × 硬質%の倍率） |
| `enemyYangDefR1` / `R2` | −10〜+10 / 0〜+10 | 陽気バレットの DEF（敵陽防の倍率、デバフで低下） |
| `enemyYinDefR1` / `R2` | 同上 | 陰気バレットの DEF（敵陰防の倍率） |
| `hitRateR1` / `R2` | 0〜+10 | 実効命中率（自身命中バフ + 敵回避デバフの合算） |
| `criAttackR1` / `R2` | 0〜+10 | クリティカル補正 $C_{crit}$（自身CRI攻撃バフ + 敵CRI防御デバフの合算） |
| `criHitR1` / `R2` | 0〜+10 | 実効CRI命中率（自身CRI命中バフ + 敵CRI回避デバフの合算） |

> **合算フィールドの意味**：hitRate・criAttack・criHit の R1 は「自身バフ段階 + 敵へのデバフ段階」を単一の数値で管理する。上限はR1で10段階、これにR2が乗算で追加される。

---

## 6. 特効（特殊弾）ロジック

- バレットの `effects` に `{ kind: '特効' }` があることは「**特効能力を持つ**」を示すだけ。
- **刺さっているか**は `SimulationConfig.specialAttackActive[bulletId]: boolean` で別管理。
- `specialAttack = hasCapability AND specialAttackActive[id]` が true のとき：
  - $r_{cri} = 1.0$（確定CRI）に強制。

---

## 7. 大結界（特殊バフ）

### 7.1 概要

- 同時に**1つのみ**有効。複数の大結界は存在できない。
- 通常バフ（RankⅠ / RankⅡ）とは**別枠乗算**。それらを適用後の数値に乗算する。
- 敵への効果はフルブレイク中も有効。

### 7.2 入力形式

1つの大結界は「ステータス種別 × 倍率方向（UP/DOWN） × %」の1エントリで表現する。  
味方と相手は**常に逆方向・同一%**：味方がUPなら相手はDOWN、味方がDOWNなら相手はUP。

### 7.3 ステータス別の計算式

| ステータス | 自身への効果 | 相手への効果 |
|-----------|-------------|-------------|
| 陽攻 | ATK（陽気）× (1 ± n/100) | 相手陽攻 ± n%（現状ダメ計算に寄与しない） |
| 陰攻 | ATK（陰気）× (1 ± n/100) | 相手陰攻 ± n%（現状ダメ計算に寄与しない） |
| 速力 | ATK（斬裂成分）× (1 ± n/100) | 相手速力 ± n%（現状ダメ計算に寄与しない） |
| 陽防 | 自身陽防（硬質成分）× (1 ± n/100) | 敵陽防 × (1 ∓ n/100)　← FB中も有効 |
| 陰防 | 自身陰防（硬質成分）× (1 ± n/100) | 敵陰防 × (1 ∓ n/100)　← FB中も有効 |
| CRI攻撃/CRI防御 | CRI時ダメ × (1 ± n/100) | CRI時ダメ × (1 ± n/100)（自身と同方向） |
| 威力 | `power × (1 ± n/100)`（少数第3位以下切り捨て） | 相手への効果なし |

> **符号の読み方**：selfDir=UP なら `+n/100`、selfDir=DOWN なら `-n/100`。CRI/CRI防御の敵側は敵CRI防御が下がるほどCRI時ダメが上がるため、自身と同方向。

### 7.4 実装コード対応

```
calcGbSelfMult(entries, stat)      → 自身側の別枠乗算
calcGbEnemyDefMult(entries, stat)  → 敵防御系の別枠乗算（陽防/陰防のみ）
calcGbCriEnemyMult(entries)        → CRI時の敵CRI防御デバフ乗算
```

---

## 8. バリデーション規則

| チェック内容 | エラー条件 |
|-------------|-----------|
| バフ段階範囲 | 各フィールドが §2.4 の有効範囲外 |
| ヒット順整合 | バレット `id` の出現回数 ≠ `bullet.count` |
| 未定義バレットID | ヒット順に存在しないIDが含まれる |

いずれかのエラーが存在する場合、シミュレーション結果は **null** となり表示されない。
