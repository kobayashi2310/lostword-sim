import type { StoryCard } from '@/types';

export const DEFAULT_STORY_CARDS: StoryCard[] = [
  {
    id: 'mugen-sekai',
    name: '夢幻世界',
    stats: {
      yangAttack: 120,
      yangDefense: 120,
    },
    effects: [
      {
        kind: '属性ダメージUP',
        target: '星',
        value: 50,
      },
      {
        kind: '弾種ダメージUP',
        target: 'レーザー弾',
        value: 50,
      },
      {
        kind: '自身バフ',
        target: '陽攻',
        value: 4,
        condition: '攻撃式',
      },
    ],
  },
];
