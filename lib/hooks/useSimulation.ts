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
  StoryCard,
  Element,
  BulletKind,
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

  // 絵札 (5スロット)
  const [equippedStoryCards, setEquippedStoryCards] = useState<
    (StoryCard | null)[]
  >([null, null, null, null, null]);

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

      // 絵札の効果をシミュレーション用に統合
      let finalInitialBuffs = { ...buffs };
      let finalDamageBonus = { ...damageBonus };

      // 効果は1枚目 (スロット0) のみ適用
      const mainCard = equippedStoryCards[0];
      if (mainCard) {
        for (const effect of mainCard.effects) {
          // 式の条件チェック (特定の式でないならスキップ。なし(空)なら無条件)
          if (
            effect.condition &&
            effect.condition !== selfStats.characterClass
          ) {
            continue;
          }

          if (effect.kind === '自身バフ') {
            const fieldMap: Record<string, keyof BuffStages> = {
              陽攻: 'yangAttackR1',
              陰攻: 'yinAttackR1',
              速力: 'speedR1',
              陽防: 'selfYangDefR1',
              陰防: 'selfYinDefR1',
              命中: 'selfHitR1',
              CRI攻撃: 'selfCriAttackR1',
              CRI命中: 'selfCriHitR1',
            };
            const field = fieldMap[effect.target];
            if (field) {
              finalInitialBuffs[field] = Math.max(
                -10,
                Math.min(10, finalInitialBuffs[field] + effect.value),
              );
            }
          } else if (effect.kind === '属性ダメージUP') {
            const el = effect.target as unknown as Element;
            const elementBonus = { ...finalDamageBonus.elementBonus };
            const currentBonus = elementBonus[el] ?? 0;
            elementBonus[el] = currentBonus + effect.value;
            finalDamageBonus.elementBonus = elementBonus;
          } else if (effect.kind === '弾種ダメージUP') {
            const bk = effect.target as unknown as BulletKind;
            const bulletKindBonus = { ...finalDamageBonus.bulletKindBonus };
            const currentBonus = bulletKindBonus[bk] ?? 0;
            bulletKindBonus[bk] = currentBonus + effect.value;
            finalDamageBonus.bulletKindBonus = bulletKindBonus;
          }
        }
      }

      // 絵札のステータス補正を統合 (5枚分すべて合算)
      const cardStats = equippedStoryCards.reduce(
        (acc, card) => {
          if (!card) return acc;
          return {
            yangAttack: acc.yangAttack + (card.stats.yangAttack ?? 0),
            yinAttack: acc.yinAttack + (card.stats.yinAttack ?? 0),
            speed: acc.speed + (card.stats.speed ?? 0),
            yangDefense: acc.yangDefense + (card.stats.yangDefense ?? 0),
            yinDefense: acc.yinDefense + (card.stats.yinDefense ?? 0),
          };
        },
        { yangAttack: 0, yinAttack: 0, speed: 0, yangDefense: 0, yinDefense: 0 },
      );

      const finalSelfStats: SelfStats = {
        ...selfStats,
        yangAttack: selfStats.yangAttack + cardStats.yangAttack,
        yinAttack: selfStats.yinAttack + cardStats.yinAttack,
        speed: selfStats.speed + cardStats.speed,
        yangDefense: selfStats.yangDefense + cardStats.yangDefense,
        yinDefense: selfStats.yinDefense + cardStats.yinDefense,
      };

      setResult(
        runSimulation({
          selfStats: finalSelfStats,
          enemyStats,
          initialBuffs: finalInitialBuffs,
          bullets,
          hitOrder,
          isGirlReincarnation,
          enemyWeakness,
          specialAttackActive,
          damageBonus: finalDamageBonus,
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
    equippedStoryCards,
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
    equippedStoryCards,
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
    setEquippedStoryCards,
  };
}
