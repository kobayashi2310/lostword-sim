'use client';

interface Props {
  label: string;
  r1: number;
  r2: number;
  r1Min?: number;
  r1Max?: number;
  r2Min?: number;
  r2Max?: number;
  onChangeR1: (v: number) => void;
  onChangeR2: (v: number) => void;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

const inputCls =
  'w-14 px-1 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-sm text-center focus:outline-none focus:border-blue-500 dark:focus:border-blue-400';

export default function BuffRankInput({
  label,
  r1,
  r2,
  r1Min = -10,
  r1Max = 10,
  r2Min = 0,
  r2Max = 10,
  onChangeR1,
  onChangeR2,
}: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 text-gray-600 dark:text-gray-300 text-right shrink-0 text-xs">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 dark:text-gray-500">R1</span>
        <input
          type="number"
          min={r1Min}
          max={r1Max}
          value={r1}
          onChange={(e) =>
            onChangeR1(clamp(Number(e.target.value), r1Min, r1Max))
          }
          className={inputCls}
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 dark:text-gray-500">R2</span>
        <input
          type="number"
          min={r2Min}
          max={r2Max}
          value={r2}
          onChange={(e) =>
            onChangeR2(clamp(Number(e.target.value), r2Min, r2Max))
          }
          className={inputCls}
        />
      </div>
    </div>
  );
}
