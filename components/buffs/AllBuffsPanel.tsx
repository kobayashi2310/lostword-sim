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

      {/* 命中バフ（自身命中バフ + 敵回避デバフ合算） */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          命中バフ
        </h4>
        <div className="space-y-1.5">
          <BuffRankInput
            label="命中"
            r1={buffs.hitRateR1}
            r2={buffs.hitRateR2}
            onChangeR1={set('hitRateR1')}
            onChangeR2={set('hitRateR2')}
          />
        </div>
      </div>

      {/* 自身 CRI攻撃バフ */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          自身 CRI攻撃バフ
        </h4>
        <div className="space-y-1.5">
          <BuffRankInput
            label="CRI攻撃"
            r1={buffs.selfCriAttackR1}
            r2={buffs.selfCriAttackR2}
            onChangeR1={set('selfCriAttackR1')}
            onChangeR2={set('selfCriAttackR2')}
          />
        </div>
      </div>

      {/* 自身 CRI命中バフ */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          自身 CRI命中バフ
        </h4>
        <div className="space-y-1.5">
          <BuffRankInput
            label="CRI命中"
            r1={buffs.selfCriHitR1}
            r2={buffs.selfCriHitR2}
            onChangeR1={set('selfCriHitR1')}
            onChangeR2={set('selfCriHitR2')}
          />
        </div>
      </div>
    </div>
  );
}
