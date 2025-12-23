import type { Clip } from '@/domain/entities/Clip';
import { getClipDuration } from '@/domain/entities/Clip';
import { formatTime } from '@/shared/utils/time';
import { useEditorStore } from '@/application/store/editorStore';

interface TimelineClipProps {
  clip: Clip;
  index: number;
}

/**
 * TimelineClip - Individual clip in the timeline
 */
export function TimelineClip({ clip, index }: TimelineClipProps) {
  const { selectedClipId, selectClip, removeClip, moveClip } = useEditorStore();
  const isSelected = selectedClipId === clip.id;
  const duration = getClipDuration(clip);
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ clipId: clip.id, fromIndex: index }));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.clipId && data.fromIndex !== index) {
        moveClip(data.clipId, index);
      }
    } catch {
      // Invalid drag data
    }
  };
  
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => selectClip(clip.id)}
      className={`
        relative flex-shrink-0 rounded-lg overflow-hidden cursor-pointer
        transition-all duration-200 select-none
        ${isSelected 
          ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-900' 
          : 'hover:ring-1 hover:ring-zinc-500'
        }
      `}
      style={{ width: Math.max(120, duration * 30) }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-800">
        <img 
          src={clip.thumbnailUrl} 
          alt={clip.name}
          className="w-full h-full object-cover"
        />
        
        {/* Clip number badge */}
        <div className="absolute top-1 left-1 px-1.5 py-0.5 text-xs font-medium bg-black/70 rounded">
          {index + 1}
        </div>
        
        {/* Duration badge */}
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 text-xs font-mono bg-black/70 rounded">
          {formatTime(duration)}
        </div>
        
        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeClip(clip.id);
          }}
          className="absolute top-1 right-1 p-1 text-white/70 hover:text-white bg-black/50 hover:bg-red-500/80 rounded transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Clip name */}
      <div className="px-2 py-1.5 bg-zinc-800 border-t border-zinc-700">
        <p className="text-xs text-zinc-300 truncate">
          {clip.name}
        </p>
      </div>
    </div>
  );
}
