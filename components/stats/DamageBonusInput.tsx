'use client';

import type { Bullet, BulletKind, DamageBonus, Element } from '@/types';

interface Props {
  bullets: Bullet[];
  damageBonus: DamageBonus;
  onChange: (bonus: DamageBonus) => void;
}

const inputCls =
  'w-20 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-sm text-right focus:outline-none focus:border-blue-500 dark:focus:border-blue-400';

const ELEMENT_COLORS: Record<string, string> = {
  星: 'text-yellow-500 dark:text-yellow-300',
  火: 'text-red-500 dark:text-red-400',
  水: 'text-blue-500 dark:text-blue-400',
  木: 'text-green-600 dark:text-green-400',
  金: 'text-yellow-600 dark:text-yellow-500',
  土: 'text-amber-600 dark:text-amber-500',
  日: 'text-orange-500 dark:text-orange-300',
  月: 'text-purple-500 dark:text-purple-400',
  無: 'text-gray-400 dark:text-gray-500',
};

export default function DamageBonusInput({
  bullets,
  damageBonus,
  onChange,
}: Props) {
  // 現在のバレット一覧から使われている属性・弾種のみ抽出（重複排除・順序維持）
  const usedElements = [...new Set(bullets.map((b) => b.element))] as Element[];
  const usedKinds = [
    ...new Set(bullets.map((b) => b.bulletKind)),
  ] as BulletKind[];

  const setElement = (el: Element, pct: number) =>
    onChange({
      ...damageBonus,
      elementBonus: { ...damageBonus.elementBonus, [el]: pct },
    });

  const setKind = (kind: BulletKind, pct: number) =>
    onChange({ ...damageBonus, bulletKindBonus: { ...damageBonus.bulletKindBonus, [kind]: pct } });

  const setAdv = (pct: number) =>
    onChange({ ...damageBonus, advantageBonus: pct });

  const setDisadv = (pct: number) =>
    onChange({ ...damageBonus, disadvantageBonus: pct });

  return (
    <div className="space-y-5">
      {/* 有利/不利補正 */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
          属性相性補正
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-600 dark:text-red-400 w-24 shrink-0">有利補正</span>
            <input
              type="number" min={0} max={500}
              value={damageBonus.advantageBonus ?? 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                setAdv(Number.isFinite(v) ? v : 0);
              }}
              className={inputCls}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">%</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              → ×{(2.0 * (1 + (damageBonus.advantageBonus ?? 0) / 100)).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 dark:text-blue-400 w-24 shrink-0">不利補正</span>
            <input
              type="number" min={0} max={500}
              value={damageBonus.disadvantageBonus ?? 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDisadv(Number.isFinite(v) ? v : 0);
              }}
              className={inputCls}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">%</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              → ×{(0.5 * (1 + (damageBonus.disadvantageBonus ?? 0) / 100)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 属性ダメージアップ */}
      {usedElements.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            属性ダメージアップ
          </h4>
          <div className="space-y-2">
            {usedElements.map((el) => (
              <div key={el} className="flex items-center gap-2">
                <span className={`w-6 text-sm font-semibold text-center shrink-0 ${ELEMENT_COLORS[el] ?? ''}`}>
                  {el}
                </span>
                <input
                  type="number" min={0} max={500}
                  value={damageBonus.elementBonus[el] ?? 0}
                  onChange={(e) => { const v = Number(e.target.value); setElement(el, Number.isFinite(v) ? v : 0); }}
                  className={inputCls}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 弾種ダメージアップ */}
      {usedKinds.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            弾種ダメージアップ
          </h4>
          <div className="space-y-2">
            {usedKinds.map((kind) => (
              <div key={kind} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-300 w-24 shrink-0">
                  {kind}
                </span>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={damageBonus.bulletKindBonus[kind] ?? 0}
                  onChange={(e) => { const v = Number(e.target.value); setKind(kind, Number.isFinite(v) ? v : 0); }}
                  className={inputCls}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  %
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500">
        属性・弾種は加算。例: 星50%+レーザー50% → ×(1+0.5+0.5)=×2.0
      </p>
    </div>
  );
}
