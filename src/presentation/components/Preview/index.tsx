import { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/application/store/editorStore';
import {
  getClipAtTime,
  getTimelineDuration,
  getClipStartTime,
  type TimelinePositionResult,
} from '@/domain/entities/Timeline';
import { getClipDuration, type Clip } from '@/domain/entities/Clip';
import type { Transition } from '@/domain/entities/Transition';
import { formatTime } from '@/shared/utils/time';

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
 */
export function Preview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const playbackFrameRef = useRef<number | undefined>(undefined);

  // Subscribe to specific store slices to minimize re-renders
  const timeline = useEditorStore((s) => s.timeline);
  const clips = useEditorStore((s) => s.clips);
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const play = useEditorStore((s) => s.play);
  const pause = useEditorStore((s) => s.pause);
  const seek = useEditorStore((s) => s.seek);

  const totalDuration = getTimelineDuration(timeline, clips);
  const hasClips = clips.size > 0;

  // Get or create a video element for a clip (with preloading)
  const getOrCreateVideo = useCallback(
    (clipId: string, sourceUrl: string): HTMLVideoElement => {
      let video = videoElementsRef.current.get(clipId);

      if (!video) {
        video = document.createElement('video');
        video.src = sourceUrl;
        video.playsInline = true;
        video.preload = 'auto';
        video.muted = false;

        // Preload the video
        video.load();

        videoElementsRef.current.set(clipId, video);
      }

      return video;
    },
    []
  );

  // Preload all clips on mount and when clips change
  useEffect(() => {
    clips.forEach((clip) => {
      getOrCreateVideo(clip.id, clip.sourceUrl);
    });

    // Cleanup: remove video elements for removed clips
    const currentClipIds = new Set(clips.keys());
    videoElementsRef.current.forEach((video, clipId) => {
      if (!currentClipIds.has(clipId)) {
        video.pause();
        video.src = '';
        videoElementsRef.current.delete(clipId);
      }
    });
  }, [clips, getOrCreateVideo]);

  /**
   * Apply transition effect to canvas
   * Handles different transition types (crossfade, fade to black/white)
   */
  const applyTransition = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      outgoingVideo: HTMLVideoElement,
      incomingVideo: HTMLVideoElement,
      transition: Transition,
      progress: number
    ) => {
      const drawVideo = (
        video: HTMLVideoElement,
        alpha: number = 1
      ) => {
        if (video.readyState < 2) return;

        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth: number;
        let drawHeight: number;
        let x: number;
        let y: number;

        if (videoAspect > canvasAspect) {
          drawWidth = canvas.width;
          drawHeight = canvas.width / videoAspect;
          x = 0;
          y = (canvas.height - drawHeight) / 2;
        } else {
          drawHeight = canvas.height;
          drawWidth = canvas.height * videoAspect;
          x = (canvas.width - drawWidth) / 2;
          y = 0;
        }

        ctx.globalAlpha = alpha;
        ctx.drawImage(video, x, y, drawWidth, drawHeight);
        ctx.globalAlpha = 1;
      };

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      switch (transition.type) {
        case 'crossfade':
          // Draw outgoing video at decreasing opacity
          drawVideo(outgoingVideo, 1 - progress);
          // Draw incoming video at increasing opacity
          drawVideo(incomingVideo, progress);
          break;

        case 'fadeToBlack':
          if (progress < 0.5) {
            // First half: fade out to black
            drawVideo(outgoingVideo, 1 - progress * 2);
          } else {
            // Second half: fade in from black
            drawVideo(incomingVideo, (progress - 0.5) * 2);
          }
          break;

        case 'fadeToWhite':
          if (progress < 0.5) {
            // First half: fade out to white
            drawVideo(outgoingVideo, 1);
            ctx.fillStyle = `rgba(255, 255, 255, ${progress * 2})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else {
            // Second half: fade in from white
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = (progress - 0.5) * 2;
            drawVideo(incomingVideo, 1);
            ctx.globalAlpha = 1;
          }
          break;

        default:
          // No transition - shouldn't happen but fallback to crossfade
          drawVideo(outgoingVideo, 1 - progress);
          drawVideo(incomingVideo, progress);
      }
    },
    []
  );

  /**
   * Apply volume crossfade during transitions
   */
  const applyVolumeCrossfade = useCallback(
    (
      outgoingVideo: HTMLVideoElement,
      incomingVideo: HTMLVideoElement,
      progress: number
    ) => {
      // Outgoing video fades out
      outgoingVideo.volume = Math.max(0, Math.min(1, 1 - progress));
      // Incoming video fades in
      incomingVideo.volume = Math.max(0, Math.min(1, progress));
    },
    []
  );

  /**
   * Get position result from current timeline state
   * Uses getState() to avoid stale closures
   */
  const getPositionResult = useCallback((): TimelinePositionResult => {
    const state = useEditorStore.getState();
    return getClipAtTime(state.timeline, state.clips, state.currentTime);
  }, []);

  /**
   * Main playback effect: Handles play/pause state changes
   * IMPORTANT: This effect should NOT depend on currentTime to avoid constant re-runs
   */
  useEffect(() => {
    if (!isPlaying) {
      // Pause all videos when playback stops
      videoElementsRef.current.forEach((video) => {
        if (!video.paused) video.pause();
        video.volume = 1; // Reset volume
      });
      return;
    }

    // When playback starts, set up the initial video(s)
    const result = getPositionResult();

    if (result.type === 'empty') {
      return;
    }

    if (result.type === 'single') {
      const { clip, relativeTime } = result;
      const video = videoElementsRef.current.get(clip.id);

      if (!video) return;

      // CRITICAL: Pause ALL other videos and reset their positions
      videoElementsRef.current.forEach((v, id) => {
        if (id !== clip.id) {
          if (!v.paused) v.pause();
          v.volume = 1;
          // Reset to beginning so it's ready for future transitions
          v.currentTime = 0;
        }
      });

      video.volume = 1;
      video.currentTime = relativeTime;
      video.play().catch((err) => {
        console.warn('Playback prevented:', err);
        pause();
      });
    }

    if (result.type === 'transition') {
      const { outgoing, incoming, progress } = result;
      const outgoingVideo = videoElementsRef.current.get(outgoing.clip.id);
      const incomingVideo = videoElementsRef.current.get(incoming.clip.id);

      if (!outgoingVideo || !incomingVideo) return;

      // Pause all other videos
      videoElementsRef.current.forEach((v, id) => {
        if (id !== outgoing.clip.id && id !== incoming.clip.id) {
          if (!v.paused) v.pause();
          v.volume = 1;
        }
      });

      // Set up outgoing video
      outgoingVideo.currentTime = outgoing.relativeTime;
      outgoingVideo.volume = 1 - progress;
      outgoingVideo.play().catch(console.error);

      // Set up incoming video at correct position
      incomingVideo.currentTime = incoming.relativeTime;
      incomingVideo.volume = progress;
      incomingVideo.play().catch(console.error);
    }
  }, [isPlaying, getPositionResult, pause]);

  /**
   * Handle seeking when paused (scrubbing)
   */
  useEffect(() => {
    if (isPlaying) return;

    const result = getPositionResult();

    if (result.type === 'empty') return;

    if (result.type === 'single') {
      const video = videoElementsRef.current.get(result.clip.id);
      if (video) {
        video.currentTime = result.relativeTime;
        video.volume = 1;
      }
    }

    if (result.type === 'transition') {
      const outgoingVideo = videoElementsRef.current.get(result.outgoing.clip.id);
      const incomingVideo = videoElementsRef.current.get(result.incoming.clip.id);

      if (outgoingVideo) {
        outgoingVideo.currentTime = result.outgoing.relativeTime;
      }
      if (incomingVideo) {
        incomingVideo.currentTime = result.incoming.relativeTime;
      }
      if (outgoingVideo && incomingVideo) {
        applyVolumeCrossfade(outgoingVideo, incomingVideo, result.progress);
      }
    }
  }, [currentTime, isPlaying, getPositionResult, applyVolumeCrossfade]);

  /**
   * Playback synchronization loop - updates timeline time based on video progress
   * Also handles clip switching and transition synchronization
   */
  useEffect(() => {
    if (!isPlaying) {
      if (playbackFrameRef.current) {
        cancelAnimationFrame(playbackFrameRef.current);
      }
      return;
    }

    let lastSyncTime = performance.now();
    let lastClipId: string | null = null;
    let wasInTransition = false;

    const syncPlayback = () => {
      const state = useEditorStore.getState();

      if (!state.isPlaying) return;

      const result = getClipAtTime(state.timeline, state.clips, state.currentTime);

      if (result.type === 'empty') {
        // End of timeline
        useEditorStore.getState().pause();
        useEditorStore.getState().seek(0);
        return;
      }

      // Get the primary video for time tracking
      let primaryClip: Clip;
      let primaryVideo: HTMLVideoElement | undefined;
      let currentClipId: string;

      if (result.type === 'single') {
        primaryClip = result.clip;
        primaryVideo = videoElementsRef.current.get(result.clip.id);
        currentClipId = result.clip.id;

        // If we just exited a transition, pause the other video
        if (wasInTransition) {
          videoElementsRef.current.forEach((video, id) => {
            if (id !== result.clip.id && !video.paused) {
              video.pause();
              video.volume = 1;
            }
          });
        }
        wasInTransition = false;
      } else {
        // During transition
        primaryClip = result.outgoing.clip;
        primaryVideo = videoElementsRef.current.get(result.outgoing.clip.id);
        currentClipId = result.outgoing.clip.id;

        const incomingVideo = videoElementsRef.current.get(result.incoming.clip.id);

        if (incomingVideo) {
          // CRITICAL: Always check and correct incoming video position
          // The incoming video should be at result.incoming.relativeTime
          const expectedTime = result.incoming.relativeTime;
          const actualTime = incomingVideo.currentTime;
          const drift = Math.abs(actualTime - expectedTime);

          // If video is more than 0.15s out of sync, correct it
          if (drift > 0.15 || incomingVideo.paused) {
            incomingVideo.currentTime = expectedTime;
          }

          // Ensure it's playing
          if (incomingVideo.paused) {
            incomingVideo.play().catch(console.error);
          }

          // Apply volume crossfade
          if (primaryVideo) {
            primaryVideo.volume = Math.max(0, Math.min(1, 1 - result.progress));
          }
          incomingVideo.volume = Math.max(0, Math.min(1, result.progress));
        }

        wasInTransition = true;
      }

      // Handle clip switching in single mode
      if (lastClipId !== null && lastClipId !== currentClipId && result.type === 'single') {
        // Pause the previous video
        const prevVideo = videoElementsRef.current.get(lastClipId);
        if (prevVideo && !prevVideo.paused) {
          prevVideo.pause();
          prevVideo.volume = 1;
        }

        // Start the new video at the correct position
        if (primaryVideo) {
          primaryVideo.currentTime = result.relativeTime;
          primaryVideo.volume = 1;
          primaryVideo.play().catch(console.error);
        }
      }
      lastClipId = currentClipId;

      if (!primaryVideo) {
        playbackFrameRef.current = requestAnimationFrame(syncPlayback);
        return;
      }

      // If primary video is paused but should be playing, restart it
      if (primaryVideo.paused) {
        primaryVideo.play().catch(console.error);
        playbackFrameRef.current = requestAnimationFrame(syncPlayback);
        return;
      }

      // Calculate timeline position from primary video's current time
      const clipStartInTimeline = getClipStartTime(
        state.timeline,
        state.clips,
        primaryClip.id
      );

      const timeInClip = primaryVideo.currentTime - primaryClip.trimStart;
      const clipDuration = getClipDuration(primaryClip);

      // Check if we need to advance (non-transition case)
      if (result.type === 'single' && timeInClip >= clipDuration - 0.05) {
        const nextTime = clipStartInTimeline + clipDuration + 0.001;
        const totalDur = getTimelineDuration(state.timeline, state.clips);

        if (nextTime >= totalDur - 0.01) {
          // End of timeline
          useEditorStore.getState().pause();
          useEditorStore.getState().seek(0);
          return;
        }

        useEditorStore.getState().seek(nextTime);
      } else {
        // Sync timeline to video time (throttled to reduce state updates)
        const now = performance.now();
        if (now - lastSyncTime > 50) {
          // ~20fps for state updates
          const newTimelineTime = clipStartInTimeline + timeInClip;
          useEditorStore.getState().seek(Math.max(0, newTimelineTime));
          lastSyncTime = now;
        }
      }

      playbackFrameRef.current = requestAnimationFrame(syncPlayback);
    };

    playbackFrameRef.current = requestAnimationFrame(syncPlayback);

    return () => {
      if (playbackFrameRef.current) {
        cancelAnimationFrame(playbackFrameRef.current);
      }
    };
  }, [isPlaying]);

  /**
   * Canvas render loop - draws video frames with transition effects
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    const render = () => {
      const state = useEditorStore.getState();
      const result = getClipAtTime(state.timeline, state.clips, state.currentTime);

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (result.type === 'empty') {
        if (!hasClips) {
          ctx.fillStyle = '#3f3f46';
          ctx.font = '16px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Add videos to get started', canvas.width / 2, canvas.height / 2);
        }
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      if (result.type === 'single') {
        const video = videoElementsRef.current.get(result.clip.id);

        if (video && video.readyState >= 2) {
          drawVideoToCanvas(ctx, canvas, video);
        }
      }

      if (result.type === 'transition') {
        const outgoingVideo = videoElementsRef.current.get(result.outgoing.clip.id);
        const incomingVideo = videoElementsRef.current.get(result.incoming.clip.id);

        if (outgoingVideo && incomingVideo) {
          applyTransition(
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

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [hasClips, applyTransition]);

  // Handle manual seeking via the slider
  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      seek(time);
    },
    [seek]
  );

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 bg-black">
        <canvas
          ref={canvasRef}
          width={854}
          height={480}
          className="max-w-full max-h-full rounded-lg shadow-2xl"
        />
      </div>

      {/* Controls */}
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
            onChange={handleSeek}
            disabled={!hasClips}
            className="flex-1 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-indigo-500
              [&::-webkit-slider-thumb]:cursor-pointer
              disabled:opacity-50"
          />

          <span className="text-xs font-mono text-zinc-400 w-12 text-right">
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Play controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Rewind */}
          <button
            onClick={() => seek(0)}
            disabled={!hasClips}
            className="p-2 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
              />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => (isPlaying ? pause() : play())}
            disabled={!hasClips}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            {isPlaying ? (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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
            )}
          </button>

          {/* Forward */}
          <button
            onClick={() => seek(totalDuration)}
            disabled={!hasClips}
            className="p-2 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to draw a video to canvas with letterboxing
 */
function drawVideoToCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement
) {
  if (video.readyState < 2) return;

  const videoAspect = video.videoWidth / video.videoHeight;
  const canvasAspect = canvas.width / canvas.height;

  let drawWidth: number;
  let drawHeight: number;
  let x: number;
  let y: number;

  if (videoAspect > canvasAspect) {
    drawWidth = canvas.width;
    drawHeight = canvas.width / videoAspect;
    x = 0;
    y = (canvas.height - drawHeight) / 2;
  } else {
    drawHeight = canvas.height;
    drawWidth = canvas.height * videoAspect;
    x = (canvas.width - drawWidth) / 2;
    y = 0;
  }

  ctx.drawImage(video, x, y, drawWidth, drawHeight);
}
