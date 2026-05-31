'use client';

interface Props {
  yangDef: number;
  yinDef: number;
  onYangDefChange: (v: number) => void;
  onYinDefChange: (v: number) => void;
}

const inputCls =
  'w-16 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-xs px-1.5 py-0.5 text-center focus:outline-none focus:border-blue-500';

function parseNonPositive(val: string): number {
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? Math.min(0, n) : 0;
}

export default function PersistentDebuffSection({
  yangDef,
  yinDef,
  onYangDefChange,
  onYinDefChange,
}: Props) {
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        永続デバフ
      </h4>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
        スキル等で付与される陽防・陰防の永続デバフ。R1と合算し
        −11以下は減衰。フルブレイク中も有効。
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-300 w-20 shrink-0">
            陽防 永続
          </span>
          <input
            type="number"
            step={1}
            max={0}
            value={yangDef}
            onChange={(e) => onYangDefChange(parseNonPositive(e.target.value))}
            className={inputCls}
          />
          <span className="text-[10px] text-gray-400">段階</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-300 w-20 shrink-0">
            陰防 永続
          </span>
          <input
            type="number"
            step={1}
            max={0}
            value={yinDef}
            onChange={(e) => onYinDefChange(parseNonPositive(e.target.value))}
            className={inputCls}
          />
          <span className="text-[10px] text-gray-400">段階</span>
        </div>
      </div>
    </div>
  );
}
