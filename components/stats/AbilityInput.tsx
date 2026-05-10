'use client';

import type {
  AbilityConfig,
  BarrierAilmentType,
  AbilityBuffPattern,
} from '@/types';

const AILMENTS: BarrierAilmentType[] = ['燃焼', '凍結', '帯電', '毒霧', '暗闇'];
const PATTERNS: AbilityBuffPattern[] = [
  '速力・命中・回避',
  '陽攻・陰攻・CRI攻撃・CRI命中',
  '陽防・陰防・CRI防御・CRI回避',
];

interface Props {
  ability: AbilityConfig;
  onChange: (ability: AbilityConfig) => void;
}

export default function AbilityInput({ ability, onChange }: Props) {
  const updateNullify = (ailment: BarrierAilmentType, checked: boolean) => {
    const next = { ...ability };
    if (checked) {
      if (!next.nullifyAilments.includes(ailment)) {
        next.nullifyAilments = [...next.nullifyAilments, ailment];
      }
    } else {
      next.nullifyAilments = next.nullifyAilments.filter((a) => a !== ailment);
    }
    onChange(next);
  };

  const updateConvert = (
    ailment: BarrierAilmentType,
    pattern: AbilityBuffPattern | 'none',
  ) => {
    const next = { ...ability };
    // 一度削除
    next.convertAilments = next.convertAilments.filter(
      (c) => c.ailment !== ailment,
    );
    if (pattern !== 'none') {
      next.convertAilments = [...next.convertAilments, { ailment, pattern }];
    }
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-2 py-1 text-left font-medium text-gray-500">
                結界異常
              </th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">
                バフ変換先
              </th>
              <th className="px-2 py-1 text-center font-medium text-gray-500">
                無効化
              </th>
            </tr>
          </thead>
          <tbody>
            {AILMENTS.map((a) => {
              const conversion = ability.convertAilments.find(
                (c) => c.ailment === a,
              );
              const isNullified = ability.nullifyAilments.includes(a);

              return (
                <tr
                  key={a}
                  className="border-b border-gray-100 dark:border-gray-800/50"
                >
                  <td className="px-2 py-2 font-medium">{a}</td>
                  <td className="px-2 py-2">
                    <select
                      value={conversion?.pattern ?? 'none'}
                      onChange={(e) =>
                        updateConvert(
                          a,
                          e.target.value as AbilityBuffPattern | 'none',
                        )
                      }
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 focus:outline-none"
                    >
                      <option value="none">なし</option>
                      {PATTERNS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={isNullified}
                      onChange={(e) => updateNullify(a, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-gray-500 italic leading-relaxed">
        ※バフ変換対象の異常は自動的にデバフ効果も無効化されます。
        <br />
        ※「無効化」にチェックした異常は、そもそも結界に付与できなくなります。
      </p>
    </div>
  );
}
