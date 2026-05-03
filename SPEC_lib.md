# ライブラリ共通関数仕様書 (lib フォルダ)

このプロジェクトのロジック層を構成する共通関数の仕様をまとめます。

## 1. buffs.ts (バフ・デバフ計算)

バフ段階に応じた倍率計算や、バフ状態の操作を担当します。

| 関数名 | 引数 | 戻り値 | 処理内容 |
| :--- | :--- | :--- | :--- |
| `getAtkDefSpdMultiplier` | `stages: number` | `number` (倍率) | 攻撃/防御/速力バフの倍率計算。1段階につき30%加算(正)または除算(負)。 |
| `getHitCriHitMultiplier` | `stages: number` | `number` (倍率) | 命中/CRI命中バフの倍率計算。+n段階で(1 + 0.2×n)倍、-n段階で1/(1 + 0.2×|n|)倍。 |
| `getCritMultiplier` | `r1: number, r2: number` | `number` (倍率) | CRIダメージの最終倍率を計算。R1が負の場合は1/(1 + 0.3×|n|)の減衰を適用。 |
| `getEffectiveHitRate` | `base, r1, r2, mustHit` | `number` (0-100) | バフと必中フラグを考慮した実効命中率。 |
| `getEffectiveCriRate` | `base, r1, r2, special` | `number` (0-100) | バフと特効フラグを考慮した実効CRI命中率。 |
| `applySelfBuff` | `buffs, type, stages` | `BuffStages` | 指定した自身バフを現在のバフ段階に加算・クランプして返す。 |
| `applyEnemyDebuff` | `buffs, type, stages` | `BuffStages` | 指定した敵デバフを適用（防御低下は負、CRI系は正方向など）して返す。 |
| `validateBuffStages` | `buffs` | `Error[]` | バフ段階が許容範囲内（-10〜+10等）にあるかチェックする。 |

## 2. damage.ts (ダメージ計算コア)

東方ロストワードのダメージ計算式に基づいた計算を行います。

| 関数名 | 引数 | 戻り値 | 処理内容 |
| :--- | :--- | :--- | :--- |
| `calcAttackPower` | `self, buffs, bullet` | `number` | バレットの陰陽に応じた基礎攻撃力に、速力(斬裂)・防御(硬質)の補正を加算した値を計算。 |
| `calcEnemyDefense` | `enemy, buffs, bullet` | `number` | 敵の基礎防御力にバフ/デバフ倍率を適用した値を計算。 |
| `calcSingleHitDamage` | `bullet, self, enemy, buffs, ...` | `number` (整数) | バレット1発分のダメージ。威力、攻防比、属性相性、CRI、各種補正を乗算し切り捨て。 |
| `calcExpectedSingleHitDamage` | `bullet, self, enemy, buffs, ...` | `number` (整数) | CRI/非CRIの期待値を命中率で補正した1発あたりの期待値ダメージ。 |
| `calcStageTotalExpected` | `bullet, self, enemy, buffs, ...` | `number` (整数) | バレット1段分の全弾合計期待値ダメージ。 |

## 3. simulation.ts (シミュレーション実行)

ヒット順に沿った動的なバフ変化を含むシミュレーションを制御します。

| 関数名 | 引数 | 戻り値 | 処理内容 |
| :--- | :--- | :--- | :--- |
| `runSimulation` | `SimulationConfig` | `SimulationResult` | 静的なバレット計算と、ヒット順シミュレーションの両方を実行して結果をまとめる。 |
| `runHitOrderSimulation` | `SimulationConfig` | `{ hitSequence, totalSimDamage }` | ヒット順に従い、バレットの発動（追加効果のバフ反映）をシミュレートしながらダメージを累積。 |
| `validateHitOrder` | `bullets, hitOrder` | `Error[]` | ヒット順に含まれる各バレットの数が、設定された弾数と一致するか検証。 |
| `parseHitOrder` | `text: string` | `HitOrder` (number[][]) | テキスト形式のヒット順設定をパースして内部形式に変換。 |
| `serializeHitOrder` | `hitOrder` | `string` | 内部形式のヒット順をテキスト形式にシリアライズ。 |

## 4. weighted.ts (統計計算)

| 関数名 | 引数 | 戻り値 | 処理内容 |
| :--- | :--- | :--- | :--- |
| `calcWeightedMultipliers` | `bullets` | `{ slash, hard }` | スペルカード全体の「加重平均斬裂/硬質倍率」を計算。全バレットの(威力×弾数)を重みとして算出。 |

## 5. defaultData.ts (デフォルトデータ)

アプリケーションの初期状態やサンプルデータを定義しています。

- `DEFAULT_SELF_STATS`: 標準的なキャラクターのステータス例。
- `DEFAULT_BULLETS`: 6段構成のサンプルバレット（バフ・デバフ・斬裂等を含む）。
- `DEFAULT_HIT_ORDER`: サンプルバレットを効率的に並べたヒット順の例。
