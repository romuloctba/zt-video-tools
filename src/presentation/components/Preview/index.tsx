import { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/application/store/editorStore';
import { getClipAtTime, getTimelineDuration } from '@/domain/entities/Timeline';
import { getClipDuration } from '@/domain/entities/Clip';
import { formatTime } from '@/shared/utils/time';

/**
 * Preview - Video preview player with canvas rendering
 * 
 * Architecture:
 * - Each clip gets its own persistent HTMLVideoElement (cached in a Map)
 * - Only ONE video plays at a time (the current clip's video)
 * - Canvas continuously renders the current video's frame
 * - During playback, we sync state to the video's actual currentTime
 * - Preload adjacent clips for smooth transitions
 */
export function Preview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const activeClipIdRef = useRef<string | null>(null);
  
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
  const getOrCreateVideo = useCallback((clipId: string, sourceUrl: string): HTMLVideoElement => {
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
  }, []);
  
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
  
  // Get the current video element based on timeline position
  const getCurrentVideo = useCallback((): HTMLVideoElement | null => {
    const clipInfo = getClipAtTime(timeline, clips, currentTime);
    if (!clipInfo) return null;
    return videoElementsRef.current.get(clipInfo.clip.id) || null;
  }, [timeline, clips, currentTime]);
  
  // Main effect: Handle play/pause and clip switching
  // This effect ONLY runs when isPlaying or activeClipId changes, NOT on every currentTime change
  useEffect(() => {
    const clipInfo = getClipAtTime(timeline, clips, useEditorStore.getState().currentTime);
    
    if (!clipInfo) {
      // No clip at current time
      videoElementsRef.current.forEach((video) => video.pause());
      activeClipIdRef.current = null;
      return;
    }
    
    const { clip, relativeTime } = clipInfo;
    const video = videoElementsRef.current.get(clip.id);
    
    if (!video) return;
    
    // Check if we're switching clips
    const clipChanged = activeClipIdRef.current !== clip.id;
    
    if (clipChanged) {
      // Pause all other videos
      videoElementsRef.current.forEach((v, id) => {
        if (id !== clip.id && !v.paused) {
          v.pause();
        }
      });
      activeClipIdRef.current = clip.id;
    }
    
    if (isPlaying) {
      // Set initial time when switching clips or starting playback
      if (clipChanged || video.paused) {
        video.currentTime = relativeTime;
      }
      
      if (video.paused) {
        video.play().catch((err) => {
          console.warn('Playback prevented:', err);
          pause();
        });
      }
    } else {
      // Paused state
      if (!video.paused) {
        video.pause();
      }
    }
  }, [isPlaying, timeline, clips, pause]);
  
  // Handle manual seeking (when user drags the slider while paused)
  useEffect(() => {
    if (isPlaying) return; // Don't interfere during playback
    
    const clipInfo = getClipAtTime(timeline, clips, currentTime);
    if (!clipInfo) return;
    
    const video = videoElementsRef.current.get(clipInfo.clip.id);
    if (!video) return;
    
    // Update active clip if needed
    if (activeClipIdRef.current !== clipInfo.clip.id) {
      // Pause previous video
      if (activeClipIdRef.current) {
        const prevVideo = videoElementsRef.current.get(activeClipIdRef.current);
        if (prevVideo) prevVideo.pause();
      }
      activeClipIdRef.current = clipInfo.clip.id;
    }
    
    // Seek the video
    video.currentTime = clipInfo.relativeTime;
  }, [currentTime, isPlaying, timeline, clips]);
  
  // Playback synchronization loop - updates timeline time based on video progress
  useEffect(() => {
    if (!isPlaying) return;
    
    let frameId: number;
    let lastSyncTime = performance.now();
    
    const syncPlayback = () => {
      const state = useEditorStore.getState();
      
      if (!state.isPlaying) return;
      
      const clipInfo = getClipAtTime(state.timeline, state.clips, state.currentTime);
      
      if (!clipInfo) {
        // End of timeline
        useEditorStore.getState().pause();
        useEditorStore.getState().seek(0);
        return;
      }
      
      const video = videoElementsRef.current.get(clipInfo.clip.id);
      
      if (!video || video.paused) {
        frameId = requestAnimationFrame(syncPlayback);
        return;
      }
      
      // Calculate timeline position from video's current time
      const clipStartInTimeline = calculateClipStartTime(
        state.timeline,
        state.clips,
        clipInfo.clip.id
      );
      
      const timeInClip = video.currentTime - clipInfo.clip.trimStart;
      const clipDuration = getClipDuration(clipInfo.clip);
      
      // Check if we've reached the end of this clip
      if (timeInClip >= clipDuration - 0.03) {
        // Move to next clip
        const nextTime = clipStartInTimeline + clipDuration + 0.001;
        const totalDur = getTimelineDuration(state.timeline, state.clips);
        
        if (nextTime >= totalDur - 0.01) {
          // End of timeline
          useEditorStore.getState().pause();
          useEditorStore.getState().seek(0);
          return;
        }
        
        // Switch to next clip
        const nextClipInfo = getClipAtTime(state.timeline, state.clips, nextTime);
        if (nextClipInfo) {
          // Pause current video
          video.pause();
          
          // Start next video
          const nextVideo = videoElementsRef.current.get(nextClipInfo.clip.id);
          if (nextVideo) {
            nextVideo.currentTime = nextClipInfo.relativeTime;
            nextVideo.play().catch(console.error);
          }
          
          activeClipIdRef.current = nextClipInfo.clip.id;
        }
        
        useEditorStore.getState().seek(nextTime);
      } else {
        // Sync timeline to video time (throttled to reduce state updates)
        const now = performance.now();
        if (now - lastSyncTime > 50) { // ~20fps for state updates
          const newTimelineTime = clipStartInTimeline + timeInClip;
          useEditorStore.getState().seek(Math.max(0, newTimelineTime));
          lastSyncTime = now;
        }
      }
      
      frameId = requestAnimationFrame(syncPlayback);
    };
    
    frameId = requestAnimationFrame(syncPlayback);
    
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isPlaying]);
  
  // Canvas render loop - continuously draws current video frame at 60fps
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;
    
    const render = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const video = getCurrentVideo();
      
      if (video && video.readyState >= 2) {
        // Calculate scaling to fit video in canvas (letterbox)
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
      } else if (!hasClips) {
        ctx.fillStyle = '#3f3f46';
        ctx.font = '16px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Add videos to get started', canvas.width / 2, canvas.height / 2);
      }
      
      animationFrameRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [hasClips, getCurrentVideo]);
  
  // Handle manual seeking via the slider
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seek(time);
  }, [seek]);
  
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
        <div className="flex items-center gap-3 mb-3">
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>
          
          {/* Play/Pause */}
          <button
            onClick={() => isPlaying ? pause() : play()}
            disabled={!hasClips}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          
          {/* Forward */}
          <button
            onClick={() => seek(totalDuration)}
            disabled={!hasClips}
            className="p-2 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate when a clip starts in the timeline (sum of all previous clip durations)
 */
function calculateClipStartTime(
  timeline: { clipIds: readonly string[] },
  clips: Map<string, { trimStart: number; trimEnd: number }>,
  targetClipId: string
): number {
  let startTime = 0;
  
  for (const clipId of timeline.clipIds) {
    if (clipId === targetClipId) {
      return startTime;
    }
    
    const clip = clips.get(clipId);
    if (clip) {
      startTime += clip.trimEnd - clip.trimStart;
    }
  }
  
  return startTime;
}
