/**
 * useCanvasRenderer - Handles canvas rendering loop for video preview
 *
 * Responsibilities:
 * - Run requestAnimationFrame loop for smooth rendering
 * - Draw video frames with letterboxing
 * - Apply transition effects between clips
 * - Show placeholder when no clips exist
 */

import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/application/store/editorStore';
import { getClipAtTime } from '@/domain/entities/Timeline';
import {
  clearCanvas,
  drawVideoFrame,
  drawPlaceholder,
  renderTransition,
} from '../utils';
import {
  CANVAS_BACKGROUND_COLOR,
  CANVAS_PLACEHOLDER_COLOR,
  PLACEHOLDER_FONT,
} from '../constants';

interface UseCanvasRendererOptions {
  /** Reference to canvas element */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Function to get video element by clip ID */
  getVideo: (clipId: string) => HTMLVideoElement | undefined;
  /** Whether there are clips in the timeline */
  hasClips: boolean;
  /** Placeholder text to show when no clips */
  placeholderText: string;
}

/**
 * Canvas rendering loop for video preview
 */
export function useCanvasRenderer({
  canvasRef,
  getVideo,
  hasClips,
  placeholderText,
}: UseCanvasRendererOptions): void {
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    const render = () => {
      // Get current state directly to avoid stale closure
      const state = useEditorStore.getState();
      const result = getClipAtTime(state.timeline, state.clips, state.currentTime);

      // Clear canvas with background
      clearCanvas(ctx, canvas.width, canvas.height, CANVAS_BACKGROUND_COLOR);

      if (result.type === 'empty') {
        // Show placeholder if no clips
        if (!hasClips) {
          drawPlaceholder(
            ctx,
            canvas,
            placeholderText,
            CANVAS_PLACEHOLDER_COLOR,
            PLACEHOLDER_FONT
          );
        }
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      if (result.type === 'single') {
        const video = getVideo(result.clip.id);

        if (video) {
          drawVideoFrame(ctx, canvas, video);
        }
      }

      if (result.type === 'transition') {
        const outgoingVideo = getVideo(result.outgoing.clip.id);
        const incomingVideo = getVideo(result.incoming.clip.id);

        if (outgoingVideo && incomingVideo) {
          renderTransition(
            ctx,
            canvas,
            outgoingVideo,
            incomingVideo,
            result.transition,
            result.progress
          );
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    // Start render loop
    render();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasRef, getVideo, hasClips, placeholderText]);
}
