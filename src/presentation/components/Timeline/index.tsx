import { useEditorStore } from '@/application/store/editorStore';
import { formatTime } from '@/shared/utils/time';
import { TimelineClip } from './TimelineClip';
import { VideoDropzone } from '../VideoDropzone';

/**
 * Timeline - Main timeline view with clips
 */
export function Timeline() {
  const { getClipsInOrder, getTotalDuration, importStatus } = useEditorStore();
  const clips = getClipsInOrder();
  const totalDuration = getTotalDuration();
  
  return (
    <div className="flex flex-col h-full bg-zinc-900 border-t border-zinc-700">
      {/* Timeline header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-medium text-zinc-300">Timeline</h2>
          <span className="text-xs text-zinc-500">
            {clips.length} clip{clips.length !== 1 ? 's' : ''} • {formatTime(totalDuration)}
          </span>
        </div>
        
        {importStatus === 'loading' && (
          <div className="flex items-center gap-2 text-xs text-indigo-400">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Importing...
          </div>
        )}
      </div>
      
      {/* Timeline content */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        {clips.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="w-full max-w-md">
              <VideoDropzone />
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 min-w-max">
            {clips.map((clip, index) => (
              <TimelineClip key={clip.id} clip={clip} index={index} />
            ))}
            
            {/* Add more button */}
            <div className="flex-shrink-0 w-32">
              <div className="relative">
                <VideoDropzone />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
