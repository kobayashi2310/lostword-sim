'use client';

interface Props {
  isGirlReincarnation: boolean;
  onGirlReincarnationChange: (v: boolean) => void;
  errorCount: number;
  hasResult: boolean;
}

export default function OptionsBar({
  isGirlReincarnation,
  onGirlReincarnationChange,
  errorCount,
  hasResult,
}: Props) {
  return (
    <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 flex items-center gap-3">
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
  );
}
