/**
 * Preview - Video preview player with canvas rendering and transition support
 *
 * Architecture:
 * - Each clip gets its own persistent HTMLVideoElement (cached in a Map)
 * - During normal playback: ONE video plays at a time
 * - During transitions: TWO videos play simultaneously with crossfading
 * - Canvas blends video frames based on transition type and progress
 * - Audio crossfades via HTMLVideoElement.volume
 * - Preload all clips for smooth transitions
 *
 * This component composes several hooks and sub-components:
 * - useVideoElements: Manages video element lifecycle
 * - usePlaybackSync: Handles playback synchronization
 * - useCanvasRenderer: Handles canvas rendering loop
 * - PreviewControls: UI for playback controls
 */

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '@/application/store/editorStore';
import { getTimelineDuration } from '@/domain/entities/Timeline';

import { useVideoElements, useCanvasRenderer, usePlaybackSync } from './hooks';
import { PreviewControls, TextOverlayEditor, PreviewInteractionLayer } from './components';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from './constants';

/**
 * Preview component - Main video preview player
 */
export function Preview() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Subscribe to specific store slices to minimize re-renders
  const timeline = useEditorStore((s) => s.timeline);
  const clips = useEditorStore((s) => s.clips);
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const play = useEditorStore((s) => s.play);
  const pause = useEditorStore((s) => s.pause);
  const seek = useEditorStore((s) => s.seek);
  const addTextOverlay = useEditorStore((s) => s.addTextOverlay);

  // Derived state
  const totalDuration = getTimelineDuration(timeline, clips);
  const hasClips = clips.size > 0;

  // Video element management
  const videoManager = useVideoElements(clips);

  const handleAddText = () => {
    addTextOverlay({
      text: 'New Text',
      startTime: currentTime,
      endTime: Math.min(currentTime + 3, totalDuration),
    });
  };

  // Playback synchronization
  usePlaybackSync({
    videoManager,
    isPlaying,
    currentTime,
    onPause: pause,
  });

  // Canvas rendering
  useCanvasRenderer({
    canvasRef,
    getVideo: videoManager.getVideo,
    hasClips,
    placeholderText: t('preview.addVideosToStart'),
  });

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-4 bg-black relative overflow-hidden">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={DEFAULT_CANVAS_WIDTH}
            height={DEFAULT_CANVAS_HEIGHT}
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
          
          {/* Interaction Layer (Direct Manipulation) */}
          <PreviewInteractionLayer canvasRef={canvasRef} />
        </div>

        {/* Text Overlay Editor (Floating) */}
        <TextOverlayEditor />
      </div>

      {/* Controls */}
      <PreviewControls
        currentTime={currentTime}
        totalDuration={totalDuration}
        isPlaying={isPlaying}
        hasClips={hasClips}
        onPlay={play}
        onPause={pause}
        onSeek={seek}
        onAddText={handleAddText}
      />
    </div>
  );
}
