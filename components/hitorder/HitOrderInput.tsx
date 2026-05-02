'use client';

import { parseHitOrder } from '@/lib/simulation';

interface Props {
  text: string;
  onChange: (text: string) => void;
}

export default function HitOrderInput({ text, onChange }: Props) {
  const parsed = parseHitOrder(text);
  const totalHits = parsed.reduce((sum, group) => sum + group.length, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          1行1グループ、スペース区切りでバレットID。例: 「1 2」= 1→2の順でヒット
        </p>
        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">
          合計 {totalHits} 発
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={22}
        spellCheck={false}
        className="w-full px-2 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 resize-y"
      />
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {parsed.length}グループ: {parsed.map((g) => g.join('-')).join(', ')}
      </p>
    </div>
  );
}
