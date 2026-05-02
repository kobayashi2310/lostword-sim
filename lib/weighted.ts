import type { Bullet } from '@/types';

/**
 * 加重平均硬斬倍率（斬裂・硬質それぞれ）
 * 倍率 = Σ(威力 × 弾数 × 各%/100) / Σ(威力 × 弾数)
 */
export function calcWeightedMultipliers(bullets: Bullet[]): {
  slash: number;
  hard: number;
} {
  let slashNumerator = 0;
  let hardNumerator = 0;
  let denominator = 0;

  for (const b of bullets) {
    const weight = b.power * b.count;
    slashNumerator += weight * (b.slashPercent / 100);
    hardNumerator += weight * (b.hardPercent / 100);
    denominator += weight;
  }

  if (denominator === 0) return { slash: 0, hard: 0 };
  return {
    slash: slashNumerator / denominator,
    hard: hardNumerator / denominator,
  };
}
