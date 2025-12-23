import { useCallback, useRef, useState, useEffect } from 'react';
import { useEditorStore } from '@/application/store/editorStore';
import { getClipDuration } from '@/domain/entities/Clip';
import { getMaxTransitionDuration, type TransitionType } from '@/domain/entities/Transition';
import { formatTime } from '@/shared/utils/time';
import { TimelineClip } from './TimelineClip';
import { VideoDropzone } from '../VideoDropzone';
import { TransitionPicker } from '../TransitionPicker';

/**
 * Timeline - Main timeline view with clips and transitions
 */
export function Timeline() {
  const {
    getClipsInOrder,
    getTotalDuration,
    importStatus,
    timeline,
    setTransition,
    removeTransition,
    getTransition,
  } = useEditorStore();

  const clips = getClipsInOrder();
  const totalDuration = getTotalDuration();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Update scroll button visibility
  const updateScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    );
  }, []);

  // Scroll left/right functions
  const scrollLeft = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: -300, behavior: 'smooth' });
  }, []);

  const scrollRight = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: 300, behavior: 'smooth' });
  }, []);

  // Update scroll buttons on mount and when clips change
  useEffect(() => {
    updateScrollButtons();
  }, [clips, updateScrollButtons]);

  // Listen for scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => updateScrollButtons();
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [updateScrollButtons]);

  // Handler for setting a transition between clips
  const handleSetTransition = useCallback(
    (fromClipId: string, toClipId: string, type: TransitionType, duration: number) => {
      setTransition(fromClipId, toClipId, type, duration);
    },
    [setTransition]
  );

  // Handler for removing a transition
  const handleRemoveTransition = useCallback(
    (fromClipId: string, toClipId: string) => {
      removeTransition(fromClipId, toClipId);
    },
    [removeTransition]
  );

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-t border-zinc-700">
      {/* Timeline header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-medium text-zinc-300">Timeline</h2>
          <span className="text-xs text-zinc-500">
            {clips.length} clip{clips.length !== 1 ? 's' : ''} • {formatTime(totalDuration)}
          </span>
          {timeline.transitions.size > 0 && (
            <span className="text-xs text-indigo-400">
              {timeline.transitions.size} transition{timeline.transitions.size !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {importStatus === 'loading' && (
          <div className="flex items-center gap-2 text-xs text-indigo-400">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Importing...
          </div>
        )}
      </div>

      {/* Timeline content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 rounded-full shadow-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 rounded-full shadow-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="h-full overflow-x-auto overflow-y-hidden"
        >
          {clips.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="w-full max-w-md">
                <VideoDropzone />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 p-4 min-w-max">
              {clips.map((clip, index) => {
                const nextClip = clips[index + 1];
                const transition = nextClip
                  ? getTransition(clip.id, nextClip.id)
                  : null;

                // Calculate max transition duration based on clip lengths
                const maxDuration = nextClip
                  ? getMaxTransitionDuration(
                      getClipDuration(clip),
                      getClipDuration(nextClip)
                    )
                  : 0;

                return (
                  <div key={clip.id} className="flex items-center gap-1">
                    <TimelineClip clip={clip} index={index} />

                    {/* Show transition picker between clips */}
                    {nextClip && (
                      <TransitionPicker
                        currentType={transition?.type ?? null}
                        currentDuration={transition?.duration ?? 1}
                        maxDuration={maxDuration}
                        onSelect={(type, duration) =>
                          handleSetTransition(clip.id, nextClip.id, type, duration)
                        }
                        onRemove={() => handleRemoveTransition(clip.id, nextClip.id)}
                      />
                    )}
                  </div>
                );
              })}

              {/* Add more button */}
              <div className="flex-shrink-0 w-32 ml-2">
                <div className="relative">
                  <VideoDropzone />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
