/**
 * PreviewControls - Playback controls for video preview
 *
 * Includes:
 * - Seek bar with time display
 * - Play/Pause button
 * - Rewind (go to start)
 * - Forward (go to end)
 */

import { useCallback } from 'react';
import { formatTime } from '@/shared/utils/time';
import type { PreviewControlsProps } from '../types';

// =============================================================================
// Icon Components (extracted for readability)
// =============================================================================

function RewindIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
      />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

// =============================================================================
// Styles
// =============================================================================

const SLIDER_CLASSES = `
  flex-1 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer
  [&::-webkit-slider-thumb]:appearance-none
  [&::-webkit-slider-thumb]:w-3
  [&::-webkit-slider-thumb]:h-3
  [&::-webkit-slider-thumb]:rounded-full
  [&::-webkit-slider-thumb]:bg-indigo-500
  [&::-webkit-slider-thumb]:cursor-pointer
  disabled:opacity-50
`;

const CONTROL_BUTTON_CLASSES = `
  p-2 text-zinc-400 hover:text-white 
  disabled:opacity-50 disabled:cursor-not-allowed 
  transition-colors
`;

const PLAY_BUTTON_CLASSES = `
  p-3 bg-indigo-600 hover:bg-indigo-500 
  disabled:bg-zinc-700 disabled:cursor-not-allowed 
  rounded-full transition-colors
`;

// =============================================================================
// Component
// =============================================================================

export function PreviewControls({
  currentTime,
  totalDuration,
  isPlaying,
  hasClips,
  onPlay,
  onPause,
  onSeek,
  onAddText,
}: PreviewControlsProps) {
  const handleSeekChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      onSeek(time);
    },
    [onSeek]
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause]);

  const handleRewind = useCallback(() => {
    onSeek(0);
  }, [onSeek]);

  const handleForward = useCallback(() => {
    onSeek(totalDuration);
  }, [onSeek, totalDuration]);

  return (
    <div className="px-4 py-3 border-t border-zinc-700">
      {/* Seek bar */}
      <div className="flex items-center gap-3 mb-1">
        <span className="text-xs font-mono text-zinc-400 w-12">
          {formatTime(currentTime)}
        </span>

        <input
          type="range"
          min={0}
          max={totalDuration || 1}
          step={0.01}
          value={currentTime}
          onChange={handleSeekChange}
          disabled={!hasClips}
          className={SLIDER_CLASSES}
        />

        <span className="text-xs font-mono text-zinc-400 w-12 text-right">
          {formatTime(totalDuration)}
        </span>
      </div>

      {/* Play controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Rewind */}
        <button
          onClick={handleRewind}
          disabled={!hasClips}
          className={CONTROL_BUTTON_CLASSES}
          aria-label="Rewind to start"
        >
          <RewindIcon />
        </button>

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          disabled={!hasClips}
          className={PLAY_BUTTON_CLASSES}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Forward */}
        <button
          onClick={handleForward}
          disabled={!hasClips}
          className={CONTROL_BUTTON_CLASSES}
          aria-label="Forward to end"
        >
          <ForwardIcon />
        </button>

        {/* Add Text */}
        <button
          onClick={onAddText}
          disabled={!hasClips}
          className={CONTROL_BUTTON_CLASSES}
          aria-label="Add text overlay"
          title="Add text overlay"
        >
          <TextIcon />
        </button>
      </div>
    </div>
  );
}
