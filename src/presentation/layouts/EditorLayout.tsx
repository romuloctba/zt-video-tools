import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ExportButton } from '../components/ExportButton';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

interface EditorLayoutProps {
  preview: ReactNode;
  timeline: ReactNode;
}

/**
 * EditorLayout - Main layout for the video editor
 */
export function EditorLayout({ preview, timeline }: EditorLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <img src="/shield.svg" alt="Zoch Tecnologia" className="w-8 h-8 text-indigo-500" />
          <h1 className="text-lg font-semibold text-white">{t('common.appName')}</h1>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <ExportButton />
        </div>
      </header>
      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Preview area */}
        <div className="flex-1 min-h-0">
          {preview}
        </div>
        {/* Timeline area */}
        <div className="h-64 flex-shrink-0">
          {timeline}
        </div>
      </main>
    </div>
  );
}
