import { useEditorStore } from '@/application/store/editorStore';
import { useExport } from '@/application/hooks/useExport';

/**
 * ExportButton - Button to export the final video
 */
export function ExportButton() {
  const { exportStatus, exportProgress, getClipsInOrder } = useEditorStore();
  const { exportVideo } = useExport();
  const clips = getClipsInOrder();
  
  const isExporting = exportStatus === 'loading';
  const hasClips = clips.length > 0;
  
  const handleExport = async () => {
    try {
      await exportVideo('my-video.webm');
    } catch (error) {
      console.error('Export failed:', error);
      alert(error instanceof Error ? error.message : 'Export failed');
    }
  };
  
  return (
    <div className="flex items-center gap-3">
      {/* Progress indicator */}
      {isExporting && exportProgress && (
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-200"
              style={{ width: `${exportProgress.percentage}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400">
            {Math.round(exportProgress.percentage)}%
          </span>
        </div>
      )}
      
      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={!hasClips || isExporting}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
          transition-colors duration-200
          ${hasClips && !isExporting
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
            : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
          }
        `}
      >
        {isExporting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Video
          </>
        )}
      </button>
    </div>
  );
}
