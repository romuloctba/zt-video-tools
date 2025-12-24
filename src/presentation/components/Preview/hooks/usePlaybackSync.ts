/**
 * usePlaybackSync - Handles playback synchronization and video control
 *
 * Responsibilities:
 * - Sync timeline time with video currentTime
 * - Handle play/pause state changes
 * - Manage clip switching during playback
 * - Handle transition synchronization and volume crossfading
 * - Handle seeking when paused (scrubbing)
 */

import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/application/store/editorStore';
import {
  getClipAtTime,
  getTimelineDuration,
  getClipStartTime,
  type TimelinePositionResult,
} from '@/domain/entities/Timeline';
import { getClipDuration } from '@/domain/entities/Clip';
import type { VideoElementsManager } from '../types';
import { applyVolumeCrossfade, clampVolume } from '../utils';
import {
  SYNC_DRIFT_THRESHOLD,
  CLIP_END_THRESHOLD,
  TIMELINE_END_THRESHOLD,
  CLIP_BOUNDARY_OFFSET,
  STATE_UPDATE_INTERVAL_MS,
} from '../constants';

interface UsePlaybackSyncOptions {
  /** Video elements manager from useVideoElements hook */
  videoManager: VideoElementsManager;
  /** Whether playback is active */
  isPlaying: boolean;
  /** Current timeline position */
  currentTime: number;
  /** Callback to pause playback */
  onPause: () => void;
}

/**
 * Get position result from current store state
 * Uses getState() to avoid stale closures in animation frames
 */
function getPositionResult(): TimelinePositionResult {
  const state = useEditorStore.getState();
  return getClipAtTime(state.timeline, state.clips, state.currentTime);
}

/**
 * Playback synchronization hook
 */
export function usePlaybackSync({
  videoManager,
  isPlaying,
  currentTime,
  onPause,
}: UsePlaybackSyncOptions): void {
  const playbackFrameRef = useRef<number | undefined>(undefined);

  /**
   * Handle play/pause state changes - setup initial video positions
   */
  useEffect(() => {
    if (!isPlaying) {
      // Pause all videos when playback stops
      videoManager.pauseAll();
      return;
    }

    // When playback starts, set up the initial video(s)
    const result = getPositionResult();

    if (result.type === 'empty') {
      return;
    }

    if (result.type === 'single') {
      const { clip, relativeTime } = result;
      const video = videoManager.getVideo(clip.id);

      if (!video) return;

      // Pause all other videos
      videoManager.pauseAllExcept([clip.id]);

      // Start the current clip
      video.volume = 1;
      video.currentTime = relativeTime;
      video.play().catch((err) => {
        console.warn('Playback prevented:', err);
        onPause();
      });
    }

    if (result.type === 'transition') {
      const { outgoing, incoming, progress } = result;
      const outgoingVideo = videoManager.getVideo(outgoing.clip.id);
      const incomingVideo = videoManager.getVideo(incoming.clip.id);

      if (!outgoingVideo || !incomingVideo) return;

      // Pause all except transition videos
      videoManager.pauseAllExcept([outgoing.clip.id, incoming.clip.id]);

      // Set up outgoing video
      outgoingVideo.currentTime = outgoing.relativeTime;
      outgoingVideo.volume = clampVolume(1 - progress);
      outgoingVideo.play().catch(console.error);

      // Set up incoming video
      incomingVideo.currentTime = incoming.relativeTime;
      incomingVideo.volume = clampVolume(progress);
      incomingVideo.play().catch(console.error);
    }
  }, [isPlaying, videoManager, onPause]);

  /**
   * Handle seeking when paused (scrubbing)
   */
  useEffect(() => {
    if (isPlaying) return;

    const result = getPositionResult();

    if (result.type === 'empty') return;

    if (result.type === 'single') {
      const video = videoManager.getVideo(result.clip.id);
      if (video) {
        video.currentTime = result.relativeTime;
        video.volume = 1;
      }
    }

    if (result.type === 'transition') {
      const outgoingVideo = videoManager.getVideo(result.outgoing.clip.id);
      const incomingVideo = videoManager.getVideo(result.incoming.clip.id);

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
  }, [currentTime, isPlaying, videoManager]);

  /**
   * Main playback synchronization loop
   * Updates timeline time based on video progress
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
        // End of timeline - stop and reset
        useEditorStore.getState().pause();
        useEditorStore.getState().seek(0);
        return;
      }

      // Get primary video for time tracking
      const primaryClip = result.type === 'single' ? result.clip : result.outgoing.clip;
      const primaryVideo = videoManager.getVideo(primaryClip.id);
      const currentClipId = primaryClip.id;

      // Handle single clip mode
      if (result.type === 'single') {
        // Clean up after exiting transition
        if (wasInTransition) {
          const allVideos = videoManager.getAllVideos();
          allVideos.forEach((video, id) => {
            if (id !== result.clip.id && !video.paused) {
              video.pause();
              video.volume = 1;
            }
          });
        }
        wasInTransition = false;
      } else {
        // Handle transition mode
        const incomingVideo = videoManager.getVideo(result.incoming.clip.id);

        if (incomingVideo) {
          // Correct incoming video position if drifted
          const expectedTime = result.incoming.relativeTime;
          const actualTime = incomingVideo.currentTime;
          const drift = Math.abs(actualTime - expectedTime);

          if (drift > SYNC_DRIFT_THRESHOLD || incomingVideo.paused) {
            incomingVideo.currentTime = expectedTime;
          }

          // Ensure incoming video is playing
          if (incomingVideo.paused) {
            incomingVideo.play().catch(console.error);
          }

          // Apply volume crossfade
          if (primaryVideo) {
            primaryVideo.volume = clampVolume(1 - result.progress);
          }
          incomingVideo.volume = clampVolume(result.progress);
        }

        wasInTransition = true;
      }

      // Handle clip switching (non-transition)
      if (lastClipId !== null && lastClipId !== currentClipId && result.type === 'single') {
        const prevVideo = videoManager.getVideo(lastClipId);
        if (prevVideo && !prevVideo.paused) {
          prevVideo.pause();
          prevVideo.volume = 1;
        }

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

      // Restart paused primary video
      if (primaryVideo.paused) {
        primaryVideo.play().catch(console.error);
        playbackFrameRef.current = requestAnimationFrame(syncPlayback);
        return;
      }

      // Calculate timeline position from video
      const clipStartInTimeline = getClipStartTime(
        state.timeline,
        state.clips,
        primaryClip.id
      );

      const timeInClip = primaryVideo.currentTime - primaryClip.trimStart;
      const clipDuration = getClipDuration(primaryClip);

      // Check if we need to advance to next clip
      if (result.type === 'single' && timeInClip >= clipDuration - CLIP_END_THRESHOLD) {
        const nextTime = clipStartInTimeline + clipDuration + CLIP_BOUNDARY_OFFSET;
        const totalDur = getTimelineDuration(state.timeline, state.clips);

        if (nextTime >= totalDur - TIMELINE_END_THRESHOLD) {
          // End of timeline
          useEditorStore.getState().pause();
          useEditorStore.getState().seek(0);
          return;
        }

        useEditorStore.getState().seek(nextTime);
      } else {
        // Sync timeline to video time (throttled)
        const now = performance.now();
        if (now - lastSyncTime > STATE_UPDATE_INTERVAL_MS) {
          const newTimelineTime = clipStartInTimeline + timeInClip;
          useEditorStore.getState().seek(Math.max(0, newTimelineTime));
          lastSyncTime = now;
        }
      }

      playbackFrameRef.current = requestAnimationFrame(syncPlayback);
    };

    // Start sync loop
    playbackFrameRef.current = requestAnimationFrame(syncPlayback);

    // Cleanup
    return () => {
      if (playbackFrameRef.current) {
        cancelAnimationFrame(playbackFrameRef.current);
      }
    };
  }, [isPlaying, videoManager]);
}
