'use client';

import { TYPICAL_BOOST_PATTERNS, type Bullet } from '@/types';
import BulletForm from './BulletForm';

interface Props {
  bullets: Bullet[];
  onChange: (bullets: Bullet[]) => void;
  activeBulletCount: number;
  boostPattern: string;
  onBoostPatternChange: (v: string) => void;
}

export default function BulletListForm({
  bullets,
  onChange,
  activeBulletCount,
  boostPattern,
  onBoostPatternChange,
}: Props) {
  const updateBullet = (updated: Bullet) => {
    onChange(bullets.map((b) => (b.id === updated.id ? updated : b)));
  };

  const isCustom = !TYPICAL_BOOST_PATTERNS.includes(boostPattern as any);

  return (
    <div className="space-y-4">
      {/* ブースト型設定エリア */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3.5 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
              ブースト型:
            </span>
            <select
              value={isCustom ? 'custom' : boostPattern}
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  onBoostPatternChange(e.target.value);
                }
              }}
              className="h-8 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md px-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {TYPICAL_BOOST_PATTERNS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value="custom">カスタム</option>
            </select>
          </div>

          {isCustom && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={boostPattern}
                onChange={(e) => onBoostPatternChange(e.target.value)}
                placeholder="X-Y-Z"
                className="w-20 h-8 text-sm text-center border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                (手入力モード)
              </span>
            </div>
          )}

          <div className="text-[10px] text-gray-500 dark:text-gray-400">
            0b=1段, 1b=+X, 2b=+Y, 3b=+Z
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {bullets.map((bullet) => (
          <BulletForm
            key={bullet.id}
            bullet={bullet}
            onChange={updateBullet}
            isActive={bullet.id <= activeBulletCount}
          />
        ))}
      </div>
    </div>
  );
}
