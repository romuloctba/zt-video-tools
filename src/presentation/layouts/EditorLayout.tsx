import type { ReactNode } from 'react';
import { ExportButton } from '../components/ExportButton';

interface EditorLayoutProps {
  preview: ReactNode;
  timeline: ReactNode;
}

/**
 * EditorLayout - Main layout for the video editor
 */
export function EditorLayout({ preview, timeline }: EditorLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 2v12h16V6H4zm10.5 6l-4 3V9l4 3z"/>
          </svg>
          <h1 className="text-lg font-semibold text-white">Video Editor</h1>
        </div>
        
        <ExportButton />
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
