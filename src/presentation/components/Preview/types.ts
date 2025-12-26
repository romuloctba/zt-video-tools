/**
 * Preview component type definitions
 */

import type { Clip } from '@/domain/entities/Clip';
import type { Transition } from '@/domain/entities/Transition';

// =============================================================================
// Canvas Drawing Types
// =============================================================================

/**
 * Dimensions and position for drawing video with letterboxing
 */
export interface LetterboxDimensions {
  /** Width to draw the video */
  drawWidth: number;
  /** Height to draw the video */
  drawHeight: number;
  /** X position (horizontal offset for centering) */
  x: number;
  /** Y position (vertical offset for centering) */
  y: number;
}

/**
 * Canvas context with dimensions for drawing operations
 */
export interface CanvasContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

// =============================================================================
// Video Element Management Types
// =============================================================================

/**
 * Map of clip IDs to their HTMLVideoElement instances
 */
export type VideoElementMap = Map<string, HTMLVideoElement>;

/**
 * Interface for video element management hook return value
 */
export interface VideoElementsManager {
  /** Get video element for a clip (creates if doesn't exist) */
  getVideo: (clipId: string) => HTMLVideoElement | undefined;
  /** Get or create video element for a clip */
  getOrCreateVideo: (clipId: string, sourceUrl: string) => HTMLVideoElement;
  /** Get all video elements */
  getAllVideos: () => VideoElementMap;
  /** Pause all videos and reset volume */
  pauseAll: () => void;
  /** Pause all videos except specified IDs */
  pauseAllExcept: (activeIds: string[]) => void;
}

// =============================================================================
// Playback Types
// =============================================================================

/**
 * Playback state for synchronization
 */
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
}

/**
 * Single clip playback info
 */
export interface SingleClipPlayback {
  clip: Clip;
  video: HTMLVideoElement;
  relativeTime: number;
}

/**
 * Transition playback info
 */
export interface TransitionPlayback {
  outgoingClip: Clip;
  outgoingVideo: HTMLVideoElement;
  outgoingRelativeTime: number;
  incomingClip: Clip;
  incomingVideo: HTMLVideoElement;
  incomingRelativeTime: number;
  transition: Transition;
  progress: number;
}

// =============================================================================
// Canvas Renderer Types
// =============================================================================

/**
 * Options for canvas renderer hook
 */
export interface CanvasRendererOptions {
  /** Reference to canvas element */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Function to get video element by clip ID */
  getVideo: (clipId: string) => HTMLVideoElement | undefined;
  /** Whether there are clips in the timeline */
  hasClips: boolean;
}

// =============================================================================
// Preview Controls Types
// =============================================================================

/**
 * Props for PreviewControls component
 */
export interface PreviewControlsProps {
  /** Current playback time in seconds */
  currentTime: number;
  /** Total timeline duration in seconds */
  totalDuration: number;
  /** Whether video is currently playing */
  isPlaying: boolean;
  /** Whether there are clips to play */
  hasClips: boolean;
  /** Callback to start playback */
  onPlay: () => void;
  /** Callback to pause playback */
  onPause: () => void;
  /** Callback to seek to specific time */
  onSeek: (time: number) => void;
  /** Callback to add a new text overlay */
  onAddText: () => void;
}
