'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  Bullet,
  BuffStages,
  DamageBonus,
  EnemyStats,
  EnemyWeaknessConfig,
  SelfStats,
  SimulationResult,
} from '@/types';
import { createDefaultDamageBonus, createDefaultWeakness } from '@/types';
import { buffValidationMessages } from '@/lib/buffs';
import {
  DEFAULT_BUFF_STAGES,
  DEFAULT_BULLETS,
  DEFAULT_ENEMY_STATS,
  DEFAULT_HIT_ORDER_TEXT,
  DEFAULT_SELF_STATS,
} from '@/lib/defaultData';
import {
  hasSpecialAttackCapability,
  parseHitOrder,
  runSimulation,
  validateHitOrder,
} from '@/lib/simulation';
import {
  getActiveCountFromBoost,
  validateBoostPattern,
  type BoostLevel,
} from '@/types';

// 特効アクティブ状態の初期化
function initSpecialAttackActive(bullets: Bullet[]): Record<number, boolean> {
  const sa: Record<number, boolean> = {};
  for (const b of bullets) {
    if (hasSpecialAttackCapability(b.effects)) sa[b.id] = true;
  }
  return sa;
}

export function useSimulation() {
  const [selfStats, setSelfStats] = useState<SelfStats>(DEFAULT_SELF_STATS);
  const [enemyStats, setEnemyStats] = useState<EnemyStats>(DEFAULT_ENEMY_STATS);
  const [buffs, setBuffs] = useState<BuffStages>(DEFAULT_BUFF_STAGES);
  const [bullets, setBullets] = useState<Bullet[]>(DEFAULT_BULLETS);
  const [hitOrderText, setHitOrderText] = useState<string>(
    DEFAULT_HIT_ORDER_TEXT,
  );
  const [isGirlReincarnation, setIsGirlReincarnation] = useState(false);

  // ブースト関連の状態
  const [boostLevel, setBoostLevel] = useState<BoostLevel>(3);
  const [boostPattern, setBoostPattern] = useState<string>('1-3-1');

  // 発動段数を計算
  const activeBulletCount = getActiveCountFromBoost(boostPattern, boostLevel);

  const [enemyWeakness, setEnemyWeakness] = useState<EnemyWeaknessConfig>(
    createDefaultWeakness,
  );
  const [specialAttackActive, setSpecialAttackActive] = useState<
    Record<number, boolean>
  >(() => initSpecialAttackActive(DEFAULT_BULLETS));
  const [damageBonus, setDamageBonus] = useState<DamageBonus>(
    createDefaultDamageBonus,
  );

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // バレット変更時に特効状態を同期
  const prevBulletsRef = useRef<Bullet[]>(DEFAULT_BULLETS);
  useEffect(() => {
    if (bullets === prevBulletsRef.current) return;
    prevBulletsRef.current = bullets;
    setSpecialAttackActive((prev) => {
      const next: Record<number, boolean> = {};
      for (const b of bullets) {
        if (hasSpecialAttackCapability(b.effects)) {
          next[b.id] = prev[b.id] ?? true;
        }
      }
      return next;
    });
  }, [bullets]);

  // 自動再計算（300msデバウンス）
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const hitOrder = parseHitOrder(hitOrderText);

      const errors: string[] = [
        ...buffValidationMessages(buffs),
        ...validateHitOrder(bullets, hitOrder).map((e) => e.message),
      ];

      // ブースト型のバリデーション
      const boostError = validateBoostPattern(boostPattern);
      if (boostError) errors.push(boostError);

      setValidationErrors(errors);

      if (errors.length > 0) {
        setResult(null);
        return;
      }

      setResult(
        runSimulation({
          selfStats,
          enemyStats,
          initialBuffs: buffs,
          bullets,
          hitOrder,
          isGirlReincarnation,
          enemyWeakness,
          specialAttackActive,
          damageBonus,
          activeBulletCount,
        }),
      );
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    selfStats,
    enemyStats,
    buffs,
    bullets,
    hitOrderText,
    isGirlReincarnation,
    boostLevel,
    boostPattern,
    activeBulletCount,
    enemyWeakness,
    specialAttackActive,
    damageBonus,
  ]);

  return {
    // States
    selfStats,
    enemyStats,
    buffs,
    bullets,
    hitOrderText,
    isGirlReincarnation,
    boostLevel,
    boostPattern,
    activeBulletCount,
    enemyWeakness,
    specialAttackActive,
    damageBonus,
    result,
    validationErrors,
    // Setters
    setSelfStats,
    setEnemyStats,
    setBuffs,
    setBullets,
    setHitOrderText,
    setIsGirlReincarnation,
    setBoostLevel,
    setBoostPattern,
    setEnemyWeakness,
    setSpecialAttackActive,
    setDamageBonus,
  };
}
