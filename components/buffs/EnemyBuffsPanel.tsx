'use client';

import type { BuffStages } from '@/types';
import {
  combinedCriAttackR1,
  combinedCriHitR1,
  combinedHitRateR1,
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
            onChangeR1={set('enemyYangDefR1')}
            onChangeR2={set('enemyYangDefR2')}
          />
          <BuffRankInput
            label="敵 陰防"
            r1={buffs.enemyYinDefR1}
            r2={buffs.enemyYinDefR2}
            onChangeR1={set('enemyYinDefR1')}
            onChangeR2={set('enemyYinDefR2')}
          />
          <div className="space-y-0.5">
            <BuffRankInput
              label="敵 回避"
              r1={buffs.enemyEvasionR1}
              r2={buffs.enemyEvasionR2}
              onChangeR1={set('enemyEvasionR1')}
              onChangeR2={set('enemyEvasionR2')}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 pl-32">
              自身命中 {buffs.selfHitR1} − 敵回避 {buffs.enemyEvasionR1} =
              combined{' '}
              <span className="font-semibold text-blue-500 dark:text-blue-400">
                {combinedHitRateR1(buffs)}
              </span>
              段
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
        <div className="space-y-2">
          {/* CRI防御 */}
          <div className="space-y-0.5">
            <BuffRankInput
              label="敵 CRI防御"
              r1={buffs.enemyCriDefR1}
              r2={0}
              r1Min={-10}
              r1Max={10}
              onChangeR1={set('enemyCriDefR1')}
              onChangeR2={() => {}}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 pl-32">
              自身CRI攻撃 {buffs.selfCriAttackR1} − 敵CRI防御{' '}
              {buffs.enemyCriDefR1} = combined{' '}
              <span className="font-semibold text-indigo-500 dark:text-indigo-400">
                {combinedCriAttackR1(buffs)}
              </span>
              段
            </p>
          </div>

          {/* CRI回避 */}
          <div className="space-y-0.5">
            <BuffRankInput
              label="敵 CRI回避"
              r1={buffs.enemyCriEvasionR1}
              r2={0}
              r1Min={-10}
              r1Max={10}
              onChangeR1={set('enemyCriEvasionR1')}
              onChangeR2={() => {}}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 pl-32">
              自身CRI命中 {buffs.selfCriHitR1} − 敵CRI回避{' '}
              {buffs.enemyCriEvasionR1} = combined{' '}
              <span className="font-semibold text-indigo-500 dark:text-indigo-400">
                {combinedCriHitR1(buffs)}
              </span>
              段
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
