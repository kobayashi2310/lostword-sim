'use client';

import type {
  ElementalAdvantage,
  ElementalElement,
  EnemyWeaknessConfig,
} from '@/types';
import { ELEMENTAL_ELEMENTS } from '@/types';

interface Props {
  weakness: EnemyWeaknessConfig;
  onChange: (weakness: EnemyWeaknessConfig) => void;
}

const ELEMENT_COLORS: Record<ElementalElement, string> = {
  星: 'text-yellow-500 dark:text-yellow-300',
  火: 'text-red-500 dark:text-red-400',
  水: 'text-blue-500 dark:text-blue-400',
  木: 'text-green-600 dark:text-green-400',
  金: 'text-yellow-600 dark:text-yellow-500',
  土: 'text-amber-600 dark:text-amber-500',
  日: 'text-orange-500 dark:text-orange-300',
  月: 'text-purple-500 dark:text-purple-400',
};

const ADV_STYLES: Record<ElementalAdvantage, string> = {
  有利: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
  等倍: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
  不利: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
};

const ALL_ADV: ElementalAdvantage[] = ['有利', '等倍', '不利'];

export default function EnemyWeaknessInput({ weakness, onChange }: Props) {
  const set = (el: ElementalElement, adv: ElementalAdvantage) =>
    onChange({ ...weakness, [el]: adv });

  return (
    <div className="space-y-2">
      <div className="grid gap-1.5">
        {ELEMENTAL_ELEMENTS.map((el) => (
          <div key={el} className="flex items-center gap-2">
            <span
              className={`w-6 text-sm font-semibold text-center shrink-0 ${ELEMENT_COLORS[el]}`}
            >
              {el}
            </span>
            <div className="flex gap-1">
              {ALL_ADV.map((adv) => (
                <button
                  key={adv}
                  onClick={() => set(el, adv)}
                  className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                    weakness[el] === adv
                      ? ADV_STYLES[adv]
                      : 'bg-transparent text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {adv}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-gray-200 dark:border-gray-700">
        <span className="w-6 text-sm text-center text-gray-400 dark:text-gray-500 shrink-0">
          無
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          無属性は常に等倍固定
        </span>
      </div>
    </div>
  );
}
