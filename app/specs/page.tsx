'use client';

import Header from '@/components/layout/Header';

export default function SpecsPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 border-b pb-2">
          ダメージ計算 仕様詳細
        </h2>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
            1. 基本ダメージ計算式
          </h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-lg font-mono text-sm leading-relaxed border border-gray-200 dark:border-gray-700">
            ダメージ = 威力 × (攻撃力 / 防御力) × 基本係数 × 0.4 × 属性相性 ×
            クリティカル補正 × 各種補正
          </div>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <strong>基本係数:</strong> 通常 100 / 少女転生時 140
            </li>
            <li>
              <strong>攻撃力:</strong> 基礎攻撃力 × バフ倍率 + (速力 × 速力バフ
              × 斬裂%) + (自身防御 × 防御バフ × 硬質%)
            </li>
            <li>
              <strong>防御力:</strong> 敵の基礎防御力 × 敵防御バフ倍率
            </li>
            <li>
              <strong>各種補正 (加算方式):</strong> 1 + (属性ダメージUP% +
              弾種ダメージUP% + その他スキル補正%)
              <p className="text-xs mt-1 text-gray-500 italic">
                例：絵札の「星属性50%UP」とスキルの「レーザー弾40%UP」がある場合、1
                + (0.5 + 0.4) = 1.9倍となります。
              </p>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
            2. バフ・デバフの倍率計算
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200">
                通常ランク (Rank 1)
              </h4>
              <p className="text-sm">
                1段階につき30%の変化。マイナス段階は除算となります（-10〜+10）。
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded">
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                    プラス (n段階)
                  </p>
                  <code className="text-sm">× (1 + 0.3 * n)</code>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded">
                  <p className="text-xs text-red-700 dark:text-red-300 mb-1">
                    マイナス (n段階)
                  </p>
                  <code className="text-sm">÷ (1 + 0.3 * |n|)</code>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200">
                つよさRank II (Rank 2)
              </h4>
              <p className="text-sm">
                通常ランクとは別枠で乗算されます。自身へのバフ（0〜10）と敵へのデバフ（-10〜0）として機能します。
              </p>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded mt-2">
                <p className="text-xs text-gray-500 mb-1">最終倍率</p>
                <code className="text-sm">通常Rank倍率 × Rank II倍率</code>
              </div>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
              <strong>💡 表示形式:</strong> シミュレーション結果では `R1/R2` 形式（例：`-10/-2`）で個別に表示されます。
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
            3. 属性相性・クリティカル
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-bold mb-2">属性相性倍率</h4>
              <ul className="list-disc pl-6 text-sm space-y-1">
                <li>
                  <strong>有利:</strong> 2.0倍
                  (有利属性ダメージアップ補正により増加)
                </li>
                <li>
                  <strong>等倍:</strong> 1.0倍
                </li>
                <li>
                  <strong>不利:</strong> 0.5倍
                  (不利属性ダメージアップ補正により増加)
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">クリティカル補正</h4>
              <p className="text-sm leading-relaxed">
                基礎 CRI ダメージは 2.0倍 です。CRI 攻撃バフにより、増加分（+100%分）に対してバフ倍率が掛かります。
                <br />
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1">
                  CRIダメージ増加率 = 1.0 * (R1合算倍率) * (R2合算倍率)
                </code>
                <br />
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1">
                  最終クリティカル倍率 = 1 + CRIダメージ増加率
                </code>
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
            4. 特殊バフ
          </h3>
          <div className="text-sm space-y-3">
            <p>
              蓄力（霊力・結界・体力）などの特殊バフは、それぞれの倍率を加算した後に最終ダメージに乗算されます。
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded border border-gray-200 dark:border-gray-700">
              <p className="font-mono">
                特殊バフ補正(蓄力) = 1 + (霊力蓄力 + 結界蓄力 + 体力蓄力)
              </p>
            </div>
            <p className="text-xs text-gray-500 italic">
              ※各蓄力の計算: 霊力/結界は「1霊力/結界数あたりの倍率 ×
              霊力/結界」、体力は「最大倍率 × (現在のHP% / 100)」となります。
            </p>
          </div>
        </section>
        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
            5. フルブレイク (Full Break)
          </h3>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p>敵の結界をすべて割り切るとフルブレイク状態となります。</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>防御力固定:</strong>{' '}
                フルブレイク中は敵の防御デバフが強制的に10段階（最大弱体）の状態として計算されます。
              </li>
              <li>
                <strong>デバフリセット:</strong>{' '}
                結界を割り切った瞬間に、それまで敵にかかっていた防御・回避・CRI関連のバフ・デバフがリセットされます。
              </li>
              <li>
                <strong>最初からフルブレイク:</strong>{' '}
                設定により、シミュレーション開始時点からこの状態を適用することも可能です。
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
            6. 貫通弾
          </h3>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 border-l-4 border-purple-200 dark:border-purple-900 pl-4">
            <p>
              「貫通弾」属性を持つバレットは、バレット自体の特性として
              <strong>敵の防御バフおよびデバフを一切無視</strong>
              して計算されます。
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                敵がどれだけ防御バフを積んでいても、基礎防御力（バフなし状態）としてダメージを与えます。
              </li>
              <li>
                逆に、敵に防御デバフが入っていてもその恩恵は受けられません。
              </li>
              <li>フルブレイク中の恩恵は得られます。</li>
              <li>
                <strong>結界異常（燃焼・毒霧）による防御低下</strong>
                は「防御デバフ」とは別枠の計算であるため、貫通弾であってもその恩恵を受けることができます。
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
            7. 結界異常と能力
          </h3>
          <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
            <p>
              結界に付与された異常状態は、攻防や命中率に直接的な影響を与えます。
              これらはバフ段階とは<strong>別枠の乗算</strong>
              として適用されます。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <h4 className="font-bold mb-2 text-orange-600">
                  燃焼 / 毒霧 / 凍結
                </h4>
                <p>1枚につき、対象の特定のステータスが 12.5% 低下します。</p>
                <ul className="mt-2 text-xs space-y-1 list-disc pl-4">
                  <li>燃焼: 陰攻・陰防が低下</li>
                  <li>毒霧: 陽攻・陽防が低下</li>
                  <li>凍結: 速力が低下</li>
                  <li>計算: 基礎ステータス × 0.875 ^ 枚数</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <h4 className="font-bold mb-2 text-blue-500">帯電 / 暗闇</h4>
                <p>命中率に直接影響を与えます。</p>
                <ul className="mt-2 text-xs space-y-1 list-disc pl-4">
                  <li>帯電(敵): 命中率が 1.25 ^ 枚数 倍に向上</li>
                  <li>暗闇(自): 命中率が 0.8 ^ 枚数 倍に低下</li>
                </ul>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-2 text-gray-800 dark:text-gray-200">
                能力による無効化・変換
              </h4>
              <p>
                キャラクターが特定の結界異常を「無効化」する場合、上記のデバフ効果は一切受けません。
                また「バフに変換」する場合、デバフを無効化した上で、異常枚数をそのまま特定のバフ段階に加算します。
              </p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>💡 結界の管理について:</strong>
                <br />
                シミュレーターでは結界を番号（1〜7）で管理しています。バレットが結界を割った場合、その番号に付与されていた結界異常も同時に消失し、以降のダメージ計算には反映されません。
              </p>
            </div>
          </div>
        </section>
        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
            8. ブレイク弾
          </h3>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <p>
              一部のバレットには、特定の結界異常が付着している結界を強制的に破壊する「ブレイク効果」があります。
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
              <ul className="grid grid-cols-2 gap-2 text-xs">
                <li><span className="font-bold text-purple-600">過毒弾:</span> 毒霧をブレイク</li>
                <li><span className="font-bold text-red-600">焼却弾:</span> 燃焼をブレイク</li>
                <li><span className="font-bold text-blue-600">氷解弾:</span> 凍結をブレイク</li>
                <li><span className="font-bold text-yellow-600">放電弾:</span> 帯電をブレイク</li>
                <li><span className="font-bold text-gray-600">閃光弾:</span> 暗闇をブレイク</li>
              </ul>
            </div>
            <h4 className="font-bold text-gray-800 dark:text-gray-200">処理の優先順位</h4>
            <p>1つのバレット内で、以下の順序で判定が行われます。</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li><strong>ブレイク効果:</strong> 対象の異常がある層をすべて破壊。</li>
              <li><strong>有利属性ブレイク:</strong> まだ結界が残っている場合、追加で1枚破壊。</li>
            </ol>
            <p className="text-xs text-gray-500 italic">
              ※ダメージ計算は「すべてブレイクし終わった後」の状態で行われます。
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
            9. バレット使用段数の制限
          </h3>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p>
              ブースト段階などに応じて、使用するバレットの段数（1〜6）を制限できます。
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>設定された段数を超えるバレットは「未発動」として扱われます。</li>
              <li>「未発動」の段はダメージを与えず、バフ・デバフ付与や結界ブレイクも一切行われません。</li>
              <li>ヒット順設定に未発動の段が含まれている場合も、そのヒットはスキップされます。</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
