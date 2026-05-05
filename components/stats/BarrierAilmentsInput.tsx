'use client';

import type { BarrierAilmentType, BarrierStatus } from '@/types';

const AILMENTS: BarrierAilmentType[] = ['燃焼', '凍結', '帯電', '毒霧', '暗闇'];

const AILMENT_COLORS: Record<BarrierAilmentType, string> = {
  燃焼: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  凍結: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  帯電: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  毒霧: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  暗闇: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

interface Props {
  barriers: BarrierStatus[];
  maxBarriers: number;
  onChange: (barriers: BarrierStatus[]) => void;
  nullifyAilments?: BarrierAilmentType[];
}

export default function BarrierAilmentsInput({
  barriers,
  maxBarriers,
  onChange,
  nullifyAilments = [],
}: Props) {
  const setAilment = (layerIdx: number, ailment: BarrierAilmentType | null) => {
    const next = [...barriers];
    // すでに同じ異常が付いている場合は解除、違う場合は上書き
    if (next[layerIdx].ailment === ailment) {
      next[layerIdx] = { ...next[layerIdx], ailment: null };
    } else {
      next[layerIdx] = { ...next[layerIdx], ailment };
    }
    onChange(next);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs text-center border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-1 py-1 text-gray-500 font-normal">層</th>
            {AILMENTS.map((a) => (
              <th key={a} className="px-1 py-1 font-normal">
                <span className={`px-1 rounded ${AILMENT_COLORS[a]}`}>{a}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxBarriers }).map((_, i) => (
            <tr
              key={i}
              className="border-b border-gray-100 dark:border-gray-800/50"
            >
              <td className="px-1 py-1.5 text-gray-400">{i + 1}</td>
              {AILMENTS.map((a) => {
                const isNullified = nullifyAilments.includes(a);
                const isChecked = barriers[i]?.ailment === a;

                return (
                  <td key={a} className="px-1 py-1">
                    <input
                      type="radio"
                      name={`barrier-${i}`}
                      checked={isChecked && !isNullified}
                      disabled={isNullified}
                      onClick={() => !isNullified && setAilment(i, a)}
                      onChange={() => {}} // onClick で制御
                      className={`w-3.5 h-3.5 focus:ring-0 cursor-pointer disabled:cursor-not-allowed ${
                        isChecked ? 'text-blue-600' : 'text-gray-300'
                      }`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {nullifyAilments.length > 0 && (
        <p className="mt-2 text-[10px] text-gray-500 italic">
          ※能力により無効化されている異常は選択できません
        </p>
      )}
    </div>
  );
}
