'use client';

import Header from '@/components/layout/Header';

export default function UsagePage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 border-b pb-2">東方LW ダメージ計算 使い方</h2>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-3 text-blue-600 dark:text-blue-400">1. 基本的な使い方</h3>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              このツールは、キャラクターのステータスやバフ、バレットの設定を入力することで、最終的なダメージ期待値を計算します。
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>ステータス入力:</strong> 攻撃側の陽攻・陰攻・速力、および防御側の陽防・陰防を入力します。</li>
              <li><strong>バレット設定:</strong> 各バレット段の威力、弾数、属性、命中率、CRI率などを設定します。</li>
              <li><strong>バフ設定:</strong> 自身や敵のバフ/デバフ段階（R1: 通常、R2: 特殊）を設定します。</li>
              <li><strong>ヒット順:</strong> どのバレットがどの順番でヒットするかを設定します。追加効果による動的なバフ変化が計算に反映されます。</li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-3 text-blue-600 dark:text-blue-400">2. 特徴的な機能</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h4 className="font-bold mb-2">動的シミュレーション</h4>
              <p className="text-sm">
                「ヒット順」タブで設定した順番に従い、バレットの追加効果（自身バフ上昇や対象デバフ低下）をリアルタイムに反映しながらダメージを計算します。
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h4 className="font-bold mb-2">斬裂弾・硬質弾</h4>
              <p className="text-sm">
                速力や防御力の一定割合を攻撃力に加算する「斬裂弾」「硬質弾」の計算に完全対応しています。
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-3 text-blue-600 dark:text-blue-400">3. バフ・デバフの仕様</h3>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="p-2 border border-gray-200 dark:border-gray-700 text-left">種類</th>
                    <th className="p-2 border border-gray-200 dark:border-gray-700 text-left">範囲</th>
                    <th className="p-2 border border-gray-200 dark:border-gray-700 text-left">倍率の変化</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-gray-200 dark:border-gray-700">Rank 1 (通常)</td>
                    <td className="p-2 border border-gray-200 dark:border-gray-700">-10 〜 +10</td>
                    <td className="p-2 border border-gray-200 dark:border-gray-700">1段階につき ±30% (攻防) / ±20% (命中)</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200 dark:border-gray-700">Rank 2 (特殊)</td>
                    <td className="p-2 border border-gray-200 dark:border-gray-700">0 〜 +10</td>
                    <td className="p-2 border border-gray-200 dark:border-gray-700">Rank 1 とは乗算で計算されます</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500">
              ※バフ段階がマイナスの場合は除算として計算されます。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
