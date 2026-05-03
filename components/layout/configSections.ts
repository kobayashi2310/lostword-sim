export type ConfigSection = 'stats' | 'buffs' | 'bullets' | 'hitorder' | 'bonus' | 'special';

export const CONFIG_SECTIONS: { id: ConfigSection; label: string }[] = [
  { id: 'stats', label: 'ステータス' },
  { id: 'buffs', label: 'バフ/デバフ' },
  { id: 'bullets', label: 'バレット' },
  { id: 'hitorder', label: 'ヒット順' },
  { id: 'bonus',    label: '補正値' },
  { id: 'special',  label: '特殊バフ' },
];
