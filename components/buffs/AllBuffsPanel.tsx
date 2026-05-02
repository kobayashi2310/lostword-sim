'use client';

import type { BuffStages } from '@/types';
import BuffRankInput from './BuffRankInput';

interface Props {
  buffs: BuffStages;
  onChange: (buffs: BuffStages) => void;
}

export default function AllBuffsPanel({ buffs, onChange }: Props) {
  const set = (field: keyof BuffStages) => (v: number) =>
    onChange({ ...buffs, [field]: v });

  return (
    <div className="space-y-5">
      {/* 自身 攻撃バフ */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          自身 攻撃バフ/デバフ
        </h4>
        <div className="space-y-1.5">
          <BuffRankInput
            label="陽攻"
            r1={buffs.yangAttackR1}
            r2={buffs.yangAttackR2}
            onChangeR1={set('yangAttackR1')}
            onChangeR2={set('yangAttackR2')}
          />
          <BuffRankInput
            label="陰攻"
            r1={buffs.yinAttackR1}
            r2={buffs.yinAttackR2}
            onChangeR1={set('yinAttackR1')}
            onChangeR2={set('yinAttackR2')}
          />
        </div>
      </div>

      {/* 自身 速力バフ */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          自身 速力バフ
        </h4>
        <div className="space-y-1.5">
          <BuffRankInput
            label="速力"
            r1={buffs.speedR1}
            r2={buffs.speedR2}
            r1Min={0}
            onChangeR1={set('speedR1')}
            onChangeR2={set('speedR2')}
          />
        </div>
      </div>

      {/* 自身 防御バフ（硬質弾用） */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          自身 防御バフ/デバフ
        </h4>
        <div className="space-y-1.5">
          <BuffRankInput
            label="自身 陽防"
            r1={buffs.selfYangDefR1}
            r2={buffs.selfYangDefR2}
            onChangeR1={set('selfYangDefR1')}
            onChangeR2={set('selfYangDefR2')}
          />
          <BuffRankInput
            label="自身 陰防"
            r1={buffs.selfYinDefR1}
            r2={buffs.selfYinDefR2}
            onChangeR1={set('selfYinDefR1')}
            onChangeR2={set('selfYinDefR2')}
          />
        </div>
      </div>

      {/* 敵 防御デバフ */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          敵 防御バフ/デバフ
        </h4>
        <div className="space-y-1.5">
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
        </div>
      </div>

      {/* 命中系 */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          命中バフ
        </h4>
        <div className="space-y-1.5">
          <BuffRankInput
            label="命中"
            r1={buffs.hitRateR1}
            r2={buffs.hitRateR2}
            r1Min={0}
            onChangeR1={set('hitRateR1')}
            onChangeR2={set('hitRateR2')}
          />
        </div>
      </div>

      {/* CRI系 */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          CRI攻撃バフ
        </h4>
        <div className="space-y-1.5">
          <BuffRankInput
            label="CRI攻撃"
            r1={buffs.criAttackR1}
            r2={buffs.criAttackR2}
            r1Min={0}
            onChangeR1={set('criAttackR1')}
            onChangeR2={set('criAttackR2')}
          />
        </div>
      </div>

      {/* CRI命中系 */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          CRI命中バフ
        </h4>
        <div className="space-y-1.5">
          <BuffRankInput
            label="CRI命中"
            r1={buffs.criHitR1}
            r2={buffs.criHitR2}
            r1Min={0}
            onChangeR1={set('criHitR1')}
            onChangeR2={set('criHitR2')}
          />
        </div>
      </div>
    </div>
  );
}
