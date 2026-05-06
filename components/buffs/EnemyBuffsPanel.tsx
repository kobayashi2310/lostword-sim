'use client';

import type { BuffStages } from '@/types';
import {
  combinedCriAttackR1,
  combinedCriAttackR2,
  combinedCriHitR1,
  combinedCriHitR2,
  combinedHitRateR1,
  combinedHitRateR2,
} from '@/types';
import BuffRankInput from './BuffRankInput';

interface Props {
  buffs: BuffStages;
  onChange: (buffs: BuffStages) => void;
}

export default function EnemyBuffsPanel({ buffs, onChange }: Props) {
  const set = (field: keyof BuffStages) => (v: number) =>
    onChange({ ...buffs, [field]: v });

  return (
    <div className="space-y-5">
      {/* 敵 防御・回避バフ/デバフ */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          敵 防御・回避バフ/デバフ
        </h4>
        <div className="space-y-3">
          <BuffRankInput
            label="敵 陽防"
            r1={buffs.enemyYangDefR1}
            r2={buffs.enemyYangDefR2}
            r2Min={-10}
            r2Max={0}
            onChangeR1={set('enemyYangDefR1')}
            onChangeR2={set('enemyYangDefR2')}
          />
          <BuffRankInput
            label="敵 陰防"
            r1={buffs.enemyYinDefR1}
            r2={buffs.enemyYinDefR2}
            r2Min={-10}
            r2Max={0}
            onChangeR1={set('enemyYinDefR1')}
            onChangeR2={set('enemyYinDefR2')}
          />
          <div className="space-y-0.5">
            <BuffRankInput
              label="敵 回避"
              r1={buffs.enemyEvasionR1}
              r2={buffs.enemyEvasionR2}
              r2Min={-10}
              r2Max={0}
              onChangeR1={set('enemyEvasionR1')}
              onChangeR2={set('enemyEvasionR2')}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 pl-32">
              Combined R1:{' '}
              <span className="font-semibold text-blue-500 dark:text-blue-400">
                {combinedHitRateR1(buffs)}
              </span>
              {' / '}
              Combined R2:{' '}
              <span className="font-semibold text-blue-500 dark:text-blue-400">
                {combinedHitRateR2(buffs)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 敵 CRIバフ/デバフ */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          敵 CRIバフ/デバフ
        </h4>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          正 = 敵がバフ（自身のCRIを減衰）、負 = 敵がデバフ（自身のCRIを強化）
        </p>
        <div className="space-y-4">
          {/* CRI防御 */}
          <div className="space-y-0.5">
            <BuffRankInput
              label="敵 CRI防御"
              r1={buffs.enemyCriDefR1}
              r2={buffs.enemyCriDefR2}
              r1Min={-10}
              r1Max={10}
              r2Min={-10}
              r2Max={0}
              onChangeR1={set('enemyCriDefR1')}
              onChangeR2={set('enemyCriDefR2')}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 pl-32">
              Combined CRI攻撃 R1:{' '}
              <span className="font-semibold text-indigo-500 dark:text-indigo-400">
                {combinedCriAttackR1(buffs)}
              </span>
              {' / '}
              Combined CRI攻撃 R2:{' '}
              <span className="font-semibold text-indigo-500 dark:text-indigo-400">
                {combinedCriAttackR2(buffs)}
              </span>
            </p>
          </div>

          {/* CRI回避 */}
          <div className="space-y-0.5">
            <BuffRankInput
              label="敵 CRI回避"
              r1={buffs.enemyCriEvasionR1}
              r2={buffs.enemyCriEvasionR2}
              r1Min={-10}
              r1Max={10}
              r2Min={-10}
              r2Max={0}
              onChangeR1={set('enemyCriEvasionR1')}
              onChangeR2={set('enemyCriEvasionR2')}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 pl-32">
              Combined CRI命中 R1:{' '}
              <span className="font-semibold text-indigo-500 dark:text-indigo-400">
                {combinedCriHitR1(buffs)}
              </span>
              {' / '}
              Combined CRI命中 R2:{' '}
              <span className="font-semibold text-indigo-500 dark:text-indigo-400">
                {combinedCriHitR2(buffs)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

