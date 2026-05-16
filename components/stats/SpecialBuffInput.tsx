'use client';

import type {
  ChargeEffect,
  DamageBonus,
  AccumulationEffect,
  GreatBarrierConfig,
  ResonanceEffect,
} from '@/types';
import ChargeBuffSection from './ChargeBuffSection';
import ResonanceBuffSection from './ResonanceBuffSection';
import AccumulationBuffSection from './AccumulationBuffSection';
import GreatBarrierSection from './GreatBarrierSection';

interface Props {
  damageBonus: DamageBonus;
  onChange: (bonus: DamageBonus) => void;
}

export default function SpecialBuffInput({ damageBonus, onChange }: Props) {
  const {
    chargeEffects,
    accumulationEffects = [],
    resonanceEffects = [],
    greatBarrier = null,
  } = damageBonus;

  const updateBonus = (updates: Partial<DamageBonus>) => {
    onChange({ ...damageBonus, ...updates });
  };

  const handleChargeChange = (effects: ChargeEffect[]) => {
    updateBonus({ chargeEffects: effects });
  };

  const handleResonanceChange = (effects: ResonanceEffect[]) => {
    updateBonus({ resonanceEffects: effects });
  };

  const handleAccumulationChange = (effects: AccumulationEffect[]) => {
    updateBonus({ accumulationEffects: effects });
  };

  const handleGreatBarrierChange = (gb: GreatBarrierConfig | null) => {
    updateBonus({ greatBarrier: gb });
  };

  return (
    <div className="space-y-4">
      {/* 蓄力セクション */}
      <ChargeBuffSection
        effects={chargeEffects}
        onChange={handleChargeChange}
      />

      <div className="border-t border-gray-100 dark:border-gray-800 my-4" />

      {/* 共鳴セクション */}
      <ResonanceBuffSection
        effects={resonanceEffects}
        onChange={handleResonanceChange}
      />

      <div className="border-t border-gray-100 dark:border-gray-800 my-4" />

      {/* 蓄積セクション */}
      <AccumulationBuffSection
        effects={accumulationEffects}
        onChange={handleAccumulationChange}
      />

      <div className="border-t border-gray-100 dark:border-gray-800 my-4" />

      {/* 大結界セクション */}
      <GreatBarrierSection
        greatBarrier={greatBarrier}
        onChange={handleGreatBarrierChange}
      />
    </div>
  );
}
