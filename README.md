# 東方LW ダメージ計算シミュレーター (lostword-sim)

このプロジェクトは、スマホゲーム「東方ロストワード」のダメージ計算を詳細にシミュレートするための Next.js アプリケーションです。

## 🚀 プロジェクト概要 (For AI/LLM Context)

このアプリは、ユーザーが入力したキャラクターのステータス、バフ/デバフ状態、およびバレット（弾）の設定に基づき、動的なダメージ推移を計算します。
単なる静的な計算機ではなく、**「ヒット順（Hit Order）に伴うリアルタイムなバフ変化」**をシミュレートできるのが特徴です。

### 技術スタック
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS (Dark/Light mode)
- **Charts**: Recharts (ダメージ分布の可視化)
- **Hooks**: Custom Hooks による状態とロジックの分離

---

## 📁 ディレクトリ構造

AIがコードを探索する際は、以下の構成を参考にしてください。

```text
.
├── app/                # Next.js App Router (唯一のエントリポイント)
│   └── page.tsx        # メインUI。LayoutコンポーネントとHookを結合する司令塔。
├── components/         # Reactコンポーネント (Atomicな設計)
│   ├── buffs/          # バフ/デバフ入力
│   ├── bullets/        # バレット設定、追加効果(Effects)入力
│   ├── hitorder/       # ヒット順設定 (テキストパース)
│   ├── layout/         # 共通レイアウト (Header, Sidebar, OptionsBar)
│   ├── results/        # 計算結果表示、グラフ(Recharts)
│   └── stats/          # キャラクター/敵ステータス、属性相性、蓄力設定
├── lib/                # ビジネスロジック・ユーティリティ
│   ├── hooks/          # カスタムフック (useSimulation, useAppSettings)
│   ├── buffs.ts        # バフ倍率計算、バリデーション
│   ├── damage.ts       # ダメージ計算コア (公式に基づいた計算式)
│   ├── simulation.ts   # ヒット順シミュレーション実行エンジン
│   ├── weighted.ts     # 加重平均計算
│   └── defaultData.ts  # 初期表示用サンプルデータ
├── types/              # TypeScript型定義
│   └── index.ts        # ドメインモデル (Bullet, BuffStages, SimulationResult等)
└── SPEC_*.md           # 各モジュールの詳細仕様書 (AI作成)
```

---

## 🧠 ドメイン知識 & ロジック

### 1. ダメージ計算式
基本式: `威力 × (攻撃力 / 防御力) × 基本係数(100/140) × 0.4 × 属性相性 × クリティカル補正 × 各種補正`

- **斬裂弾**: `攻撃力 += 速力 × 速力バフ × 斬裂%`
- **硬質弾**: `攻撃力 += 防御 × 防御バフ × 硬質%`
- **属性相性**: 有利(2.0x), 等倍(1.0x), 不利(0.5x)。補正値により変動。
- **蓄力**: 霊力/結界/体力の蓄力値を加算し、最終ダメージに乗算。

### 2. バフシステム
- **Rank 1 (R1)**: 通常バフ。-10〜+10段階。1段階につき30%増減（除算/乗算）。
- **Rank 2 (R2)**: 特殊バフ。0〜+10段階。
- **命中/CRI系**: 1段階につき20%加算。

### 3. シミュレーション・エンジン (`lib/simulation.ts`)
1. **静的計算**: 各バレット単体の期待値を初期バフ固定で計算。
2. **動的計算 (Hit Order)**:
   - バレットを1発ずつヒットさせる。
   - バレットが持つ「追加効果（自身バフ/対象デバフ）」を**その場でバフ状態に反映**。
   - 次のバレットは「更新されたバフ状態」で計算される。

---

## 🛠 開発者向けコマンド

```bash
npm install     # 依存関係のインストール
npm run dev     # 開発サーバー起動 (http://localhost:3000)
npm run build   # ビルド
npm run lint    # 静的解析
```

## 📝 仕様書 (AI自動生成)
詳細な仕様については、以下のドキュメントを参照してください。
- `SPEC_app.md`: App Router の構造
- `SPEC_components.md`: コンポーネントの役割とProps
- `SPEC_lib.md`: ロジック関数の詳細
- `SPEC_types.md`: データ構造の定義
