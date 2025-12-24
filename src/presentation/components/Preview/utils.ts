/**
 * Preview component utility functions
 * Pure functions for canvas drawing and video calculations
 */

import type { Transition } from '@/domain/entities/Transition';
import type { LetterboxDimensions } from './types';
import {
  MIN_VIDEO_READY_STATE,
  CANVAS_BACKGROUND_COLOR,
  FADE_WHITE_COLOR,
  TRANSITION_MIDPOINT,
} from './constants';

// =============================================================================
// Volume Utilities
// =============================================================================

/**
 * Clamp volume to valid range [0, 1]
 */
export function clampVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume));
}

/**
 * Apply volume crossfade between two videos during transition
 */
export function applyVolumeCrossfade(
  outgoingVideo: HTMLVideoElement,
  incomingVideo: HTMLVideoElement,
  progress: number
): void {
  outgoingVideo.volume = clampVolume(1 - progress);
  incomingVideo.volume = clampVolume(progress);
}

// =============================================================================
// Letterbox Calculations
// =============================================================================

/**
 * Calculate letterbox dimensions for drawing video on canvas
 * Maintains aspect ratio and centers the video
 */
export function calculateLetterbox(
  videoWidth: number,
  videoHeight: number,
  canvasWidth: number,
  canvasHeight: number
): LetterboxDimensions {
  const videoAspect = videoWidth / videoHeight;
  const canvasAspect = canvasWidth / canvasHeight;

  let drawWidth: number;
  let drawHeight: number;
  let x: number;
  let y: number;

  if (videoAspect > canvasAspect) {
    // Video is wider than canvas - fit to width
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / videoAspect;
    x = 0;
    y = (canvasHeight - drawHeight) / 2;
  } else {
    // Video is taller than canvas - fit to height
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * videoAspect;
    x = (canvasWidth - drawWidth) / 2;
    y = 0;
  }

  return { drawWidth, drawHeight, x, y };
}

// =============================================================================
// Canvas Drawing Functions
// =============================================================================

/**
 * Check if video is ready to render frames
 */
export function isVideoReady(video: HTMLVideoElement): boolean {
  return video.readyState >= MIN_VIDEO_READY_STATE;
}

/**
 * Clear canvas with background color
 */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string = CANVAS_BACKGROUND_COLOR
): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw video frame to canvas with letterboxing
 */
export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  alpha: number = 1
): void {
  if (!isVideoReady(video)) return;

  const { drawWidth, drawHeight, x, y } = calculateLetterbox(
    video.videoWidth,
    video.videoHeight,
    canvas.width,
    canvas.height
  );

  if (alpha < 1) {
    ctx.globalAlpha = alpha;
  }

  ctx.drawImage(video, x, y, drawWidth, drawHeight);

  if (alpha < 1) {
    ctx.globalAlpha = 1;
  }
}

/**
 * Draw placeholder text when no videos are loaded
 */
export function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  text: string,
  color: string,
  font: string
): void {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

// =============================================================================
// Transition Rendering
// =============================================================================

/**
 * Render crossfade transition between two videos
 */
function renderCrossfade(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  outgoingVideo: HTMLVideoElement,
  incomingVideo: HTMLVideoElement,
  progress: number
): void {
  drawVideoFrame(ctx, canvas, outgoingVideo, 1 - progress);
  drawVideoFrame(ctx, canvas, incomingVideo, progress);
}

/**
 * Render fade-to-black transition between two videos
 */
function renderFadeToBlack(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  outgoingVideo: HTMLVideoElement,
  incomingVideo: HTMLVideoElement,
  progress: number
): void {
  if (progress < TRANSITION_MIDPOINT) {
    // First half: fade out to black
    drawVideoFrame(ctx, canvas, outgoingVideo, 1 - progress * 2);
  } else {
    // Second half: fade in from black
    drawVideoFrame(ctx, canvas, incomingVideo, (progress - TRANSITION_MIDPOINT) * 2);
  }
}

/**
 * Render fade-to-white transition between two videos
 */
function renderFadeToWhite(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  outgoingVideo: HTMLVideoElement,
  incomingVideo: HTMLVideoElement,
  progress: number
): void {
  if (progress < TRANSITION_MIDPOINT) {
    // First half: fade out to white
    drawVideoFrame(ctx, canvas, outgoingVideo, 1);
    ctx.fillStyle = `rgba(255, 255, 255, ${progress * 2})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    // Second half: fade in from white
    ctx.fillStyle = FADE_WHITE_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = (progress - TRANSITION_MIDPOINT) * 2;
    drawVideoFrame(ctx, canvas, incomingVideo, 1);
    ctx.globalAlpha = 1;
  }
}

/**
 * Apply transition effect to canvas
 * Routes to specific transition renderer based on type
 */
export function renderTransition(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  outgoingVideo: HTMLVideoElement,
  incomingVideo: HTMLVideoElement,
  transition: Transition,
  progress: number
): void {
  // Clear canvas first
  clearCanvas(ctx, canvas.width, canvas.height);

  switch (transition.type) {
    case 'crossfade':
      renderCrossfade(ctx, canvas, outgoingVideo, incomingVideo, progress);
      break;

    case 'fadeToBlack':
      renderFadeToBlack(ctx, canvas, outgoingVideo, incomingVideo, progress);
      break;

    case 'fadeToWhite':
      renderFadeToWhite(ctx, canvas, outgoingVideo, incomingVideo, progress);
      break;

    default:
      // Fallback to crossfade for unknown types
      renderCrossfade(ctx, canvas, outgoingVideo, incomingVideo, progress);
  }
}
