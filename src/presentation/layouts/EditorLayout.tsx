import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
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
    <div className="flex flex-col min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-800">
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
      <main className="flex-1 flex flex-col">
        {/* Preview area */}
        <div className="flex-1 min-h-[400px]">
          {preview}
        </div>
        {/* Timeline area */}
        <div className="h-64 shrink-0">
          {timeline}
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 px-4 py-3 border-t border-zinc-800 text-center text-xs text-zinc-500">
        <Trans i18nKey="common.footerText" components={{ a: <a /> }} />
      </footer>
    </div>
  );
}
