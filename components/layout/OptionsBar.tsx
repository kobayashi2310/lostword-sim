'use client';

interface Props {
  isGirlReincarnation: boolean;
  onGirlReincarnationChange: (v: boolean) => void;
  activeBulletCount: number;
  onActiveBulletCountChange: (v: number) => void;
  errorCount: number;
  hasResult: boolean;
}

export default function OptionsBar({
  isGirlReincarnation,
  onGirlReincarnationChange,
  activeBulletCount,
  onActiveBulletCountChange,
  errorCount,
  hasResult,
}: Props) {
  return (
    <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isGirlReincarnation}
            onChange={(e) => onGirlReincarnationChange(e.target.checked)}
            className="w-3.5 h-3.5 accent-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            少女転生（×140）
          </span>
        </label>

        <div className="h-4 w-px bg-gray-200 dark:border-gray-700" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            使用段数:
          </span>
          <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded p-0.5">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => onActiveBulletCountChange(num)}
                className={`
                  w-7 h-7 text-xs font-bold rounded transition-colors
                  ${
                    activeBulletCount === num
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }
                `}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {errorCount > 0 && (
          <span className="text-xs text-red-500 dark:text-red-400">
            ⚠ {errorCount}件のエラー
          </span>
        )}
        {errorCount === 0 && hasResult && (
          <span className="text-xs text-green-600 dark:text-green-400">
            ✓ 計算済み
          </span>
        )}
      </div>
    </div>
  );
}
