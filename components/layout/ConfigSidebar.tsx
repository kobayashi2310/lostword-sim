'use client';

import React from 'react';
import { ConfigSection, CONFIG_SECTIONS } from './configSections';

interface Props {
  activeSection: ConfigSection;
  onSectionChange: (section: ConfigSection) => void;
  width?: string;
  children: React.ReactNode;
}

const sideNavBtn = (active: boolean) =>
  `w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
    active
      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`;

export default function ConfigSidebar({
  activeSection,
  onSectionChange,
  width = 'w-32',
  children,
}: Props) {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <nav
        className={`${width} flex-none border-r border-gray-200 dark:border-gray-700 p-2 space-y-0.5 bg-white dark:bg-gray-800`}
      >
        {CONFIG_SECTIONS.map((s) => (
          <button
            key={s.id}
            className={sideNavBtn(activeSection === s.id)}
            onClick={() => onSectionChange(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}
