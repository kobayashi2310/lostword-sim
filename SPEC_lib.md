# ライブラリ共通関数仕様書 (lib フォルダ)

このプロジェクトのロジック層を構成する共通関数の仕様をまとめます。

## 1. buffs.ts (バフ・デバフ計算)

バフ段階に応じた倍率計算や、バフ状態の操作を担当します。

| 関数名 | 引数 | 戻り値 | 処理内容 |
| :--- | :--- | :--- | :--- |
| `getAtkDefSpdMultiplier` | `stages: number` | `number` (倍率) | 攻撃/防御/速力バフの倍率計算。+n段階で(1 + 0.3×n)倍、-n段階で1/(1 + 0.3×|n|)倍。 |
| `getHitCriHitMultiplier` | `stages: number` | `number` (倍率) | 命中/CRI命中バフの倍率計算。+n段階で(1 + 0.2×n)倍、-n段階で1/(1 + 0.2×|n|)倍。 |
| `getCritMultiplier` | `r1: number, r2: number` | `number` (倍率) | CRIダメージの最終倍率を計算。R1が負の場合は1/(1 + 0.3×|n|)の減衰を適用。 |
| `getEffectiveHitRate` | `base, r1, r2, mustHit, ...` | `number` (0-100) | バフ、必中フラグ、および結界異常（帯電・暗闇）を考慮した実効命中率。 |
| `getEffectiveCriRate` | `base, r1, r2, special` | `number` (0-100) | バフと特効フラグを考慮した実効CRI命中率。負の段階はCRI率低下として作用。 |
| `getAilmentStacks` | `barriers, nullifyList` | `Record<Type, number>` | 結界から異常枚数を集計。能力による無効化設定を反映。 |
| `getAbilityBuffBonus` | `ailments, ability` | `Record<Pattern, number>` | 結界異常から能力によるバフ変換値を計算。 |
| `applySelfBuff` | `buffs, type, stages` | `BuffStages` | 指定した自身バフを現在のバフ段階に加算・クランプして返す。R1は -10〜10 の範囲。 |
| `applyEnemyDebuff` | `buffs, type, stages` | `BuffStages` | 指定した敵デバフを適用して返す。バレットの追加効果としてバフ段階を増減させる。 |
| `validateBuffStages` | `buffs` | `Error[]` | バフ段階が許容範囲内（R1: -10〜+10, R2: 0〜+10）にあるかチェックする。 |

## 2. damage.ts (ダメージ計算コア)

東方ロストワードのダメージ計算式に基づいた計算を行います。

| 関数名 | 引数 | 戻り値 | 処理内容 |
| :--- | :--- | :--- | :--- |
| `calcAttackPower` | `self, buffs, bullet, selfAilments` | `number` | 基礎攻撃力に速力/防御補正、および結界異常（燃焼/毒霧）の影響を適用。 |
| `calcEnemyDefense` | `enemy, buffs, bullet, enemyAilments, isFB` | `number` | 敵の基礎防御力にバフ、結界異常、およびフルブレイク/貫通弾の影響を適用。 |
| `calcSingleHitDamage` | `bullet, self, enemy, buffs, ...` | `number` (整数) | バレット1発分のダメージ。威力、攻防比、属性相性、CRI、各種補正、結界異常を乗算。 |
| `calcExpectedSingleHitDamage` | `bullet, self, enemy, buffs, ...` | `number` (整数) | CRI/非CRIの期待値を命中率（結界異常込み）で補正した期待値。 |
| `calcStageTotalExpected` | `bullet, self, enemy, buffs, ...` | `number` (整数) | バレット1段分の全弾合計期待値ダメージ。 |

## 3. simulation.ts (シミュレーション実行)

ヒット順に沿った動的なバフ変化を含むシミュレーションを制御します。

| 関数名 | 引数 | 戻り値 | 処理内容 |
| :--- | :--- | :--- | :--- |
| `runSimulation` | `SimulationConfig` | `SimulationResult` | 静的なバレット計算と、ヒット順シミュレーションの両方を実行。シミュレーション結果をバレットごとに集計した `bulletSimResults` も作成する。 |
| `runHitOrderSimulation` | `SimulationConfig` | `{ hitSequence, totalSimDamage }` | ヒット順に従い、バレットの発動（追加効果のバフ反映）をシミュレートしながらダメージを累積。 |

**シミュレーション中の特殊ロジック:**
- **結界ブレイク**:
  1. **ブレイク弾**: 追加効果（過毒・放電等）により、対象の結界異常が付与されている層をすべて同時にブレイクする。
  2. **属性ブレイク**: 有利属性バレットがヒットした際、結界を1枚消費する（ブレイク弾の処理後に結界が残っている場合のみ）。
- **結界異常付与**:
  - 追加効果（噴毒・焼夷等）により、自身または相手に結界異常を付与する。
  - **スタック規則**: 新しい異常は常に結界の1番スロットに付与され、既存の異常は後ろのスロットへ押し出される。結界スロットがすべて異常で埋まっている場合は付与されない。
- **フルブレイク (FB)**: 結界をすべて割り切ると発生。
  - **デバフリセット**: 発生した瞬間に、敵の「陽防/陰防/回避/CRI防御/CRI回避」のR1/R2バフがすべて 0 にリセットされる。
  - **防御固定**: FB中の攻撃は、敵の防御デバフを強制的に -10 段階として計算する。
- **異常の消失**: 結界が割れると、その結界に付与されていた異常の効果も消失する。
- **能力の適用**: フルブレイク中であっても、攻撃側の能力（異常をバフに変換等）は通常通り適用される。防御側の能力（異常を防御バフに変換等）は、FBにより異常自体が消失するため実質的に機能しなくなる。

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
