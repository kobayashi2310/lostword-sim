'use client';

import type { Bullet } from '@/types';
import BulletForm from './BulletForm';

interface Props {
  bullets: Bullet[];
  onChange: (bullets: Bullet[]) => void;
}

export default function BulletListForm({ bullets, onChange }: Props) {
  const updateBullet = (updated: Bullet) => {
    onChange(bullets.map((b) => (b.id === updated.id ? updated : b)));
  };

  return (
    <div className="space-y-2">
      {bullets.map((bullet) => (
        <BulletForm key={bullet.id} bullet={bullet} onChange={updateBullet} />
      ))}
    </div>
  );
}
