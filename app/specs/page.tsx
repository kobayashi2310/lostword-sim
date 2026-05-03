'use client';

import Header from '@/components/layout/Header';

export default function SpecsPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 border-b pb-2">ダメージ計算 仕様詳細</h2>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">1. 基本ダメージ計算式</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-lg font-mono text-sm leading-relaxed border border-gray-200 dark:border-gray-700">
            ダメージ = 威力 × (攻撃力 / 防御力) × 基本係数 × 0.4 × 属性相性 × クリティカル補正 × 各種補正 × 蓄力補正
          </div>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li><strong>基本係数:</strong> 通常 100 / 少女転生時 140</li>
            <li><strong>攻撃力:</strong> 基礎攻撃力 × バフ倍率 + (速力 × 速力バフ × 斬裂%) + (自身防御 × 防御バフ × 硬質%)</li>
            <li><strong>防御力:</strong> 敵の基礎防御力 × 敵防御バフ倍率</li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">2. バフ・デバフの倍率計算</h3>
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-gray-200">攻撃・防御・速力系 (Rank 1)</h4>
            <p className="text-sm">1段階につき30%の変化。マイナス段階は除算となります。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">プラス (n段階)</p>
                <code className="text-sm">× (1 + 0.3 * n)</code>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded">
                <p className="text-xs text-red-700 dark:text-red-300 mb-1">マイナス (n段階)</p>
                <code className="text-sm">÷ (1 + 0.3 * |n|)</code>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">3. 属性相性・クリティカル</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-bold mb-2">属性相性倍率</h4>
              <ul className="list-disc pl-6 text-sm space-y-1">
                <li><strong>有利:</strong> 2.0倍 (有利属性ダメージアップ補正により増加)</li>
                <li><strong>等倍:</strong> 1.0倍</li>
                <li><strong>不利:</strong> 0.5倍 (不利属性ダメージアップ補正により増加)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">クリティカル補正</h4>
              <p className="text-sm leading-relaxed">
                基礎 CRI ダメージは 2.0倍 です。CRI 攻撃バフにより、増加分（+100%分）に対してバフ倍率が掛かります。<br/>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1">補正 = 1 + (1.0 * R1倍率 * R2倍率)</code>
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">4. 蓄力システム</h3>
          <div className="text-sm space-y-3">
            <p>蓄力（霊力・結界・体力）は、それぞれの倍率を加算した後に最終ダメージに乗算されます。</p>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded border border-gray-200 dark:border-gray-700">
              <p className="font-mono">蓄力補正 = 1 + (霊力蓄力 + 結界蓄力 + 体力蓄力)</p>
            </div>
            <p className="text-xs text-gray-500 italic">
              ※各蓄力の計算: 霊力/結界は「1スタックあたりの倍率 × スタック数」、体力は「最大倍率 × (現在のHP% / 100)」となります。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
