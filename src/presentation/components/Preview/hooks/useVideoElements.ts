/**
 * useVideoElements - Manages HTMLVideoElement lifecycle for clips
 *
 * Responsibilities:
 * - Create and cache video elements for each clip
 * - Preload videos for smooth playback
 * - Clean up video elements when clips are removed
 * - Provide utilities to control all videos (pause, reset volume)
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { Clip } from '@/domain/entities/Clip';
import type { VideoElementMap, VideoElementsManager } from '../types';

/**
 * Creates and manages HTMLVideoElement instances for video clips
 */
export function useVideoElements(clips: Map<string, Clip>): VideoElementsManager {
  const videoElementsRef = useRef<VideoElementMap>(new Map());

  /**
   * Get or create a video element for a clip
   */
  const getOrCreateVideo = useCallback(
    (clipId: string, sourceUrl: string): HTMLVideoElement => {
      let video = videoElementsRef.current.get(clipId);

      if (!video) {
        video = document.createElement('video');
        video.src = sourceUrl;
        video.playsInline = true;
        video.preload = 'auto';
        video.muted = false;

        // Start preloading
        video.load();

        videoElementsRef.current.set(clipId, video);
      }

      return video;
    },
    []
  );

  /**
   * Get video element by clip ID (returns undefined if not found)
   */
  const getVideo = useCallback((clipId: string): HTMLVideoElement | undefined => {
    return videoElementsRef.current.get(clipId);
  }, []);

  /**
   * Get all video elements
   */
  const getAllVideos = useCallback((): VideoElementMap => {
    return videoElementsRef.current;
  }, []);

  /**
   * Pause all videos and reset volume to 1
   */
  const pauseAll = useCallback((): void => {
    videoElementsRef.current.forEach((video) => {
      if (!video.paused) {
        video.pause();
      }
      video.volume = 1;
    });
  }, []);

  /**
   * Pause all videos except those with specified IDs
   */
  const pauseAllExcept = useCallback((activeIds: string[]): void => {
    const activeSet = new Set(activeIds);

    videoElementsRef.current.forEach((video, id) => {
      if (!activeSet.has(id)) {
        if (!video.paused) {
          video.pause();
        }
        video.volume = 1;
        // Reset position for future use
        video.currentTime = 0;
      }
    });
  }, []);

  /**
   * Preload all clips and clean up removed clips
   */
  useEffect(() => {
    // Preload all current clips
    clips.forEach((clip) => {
      getOrCreateVideo(clip.id, clip.sourceUrl);
    });

    // Clean up video elements for removed clips
    const currentClipIds = new Set(clips.keys());

    videoElementsRef.current.forEach((video, clipId) => {
      if (!currentClipIds.has(clipId)) {
        video.pause();
        video.src = '';
        videoElementsRef.current.delete(clipId);
      }
    });
  }, [clips, getOrCreateVideo]);

  // Memoize the manager object to prevent effect re-runs in consumers
  const manager = useMemo<VideoElementsManager>(
    () => ({
      getVideo,
      getOrCreateVideo,
      getAllVideos,
      pauseAll,
      pauseAllExcept,
    }),
    [getVideo, getOrCreateVideo, getAllVideos, pauseAll, pauseAllExcept]
  );

  return manager;
}
