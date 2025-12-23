import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Clip } from '@/domain/entities/Clip';
import { createClip, getClipDuration } from '@/domain/entities/Clip';
import type { Timeline } from '@/domain/entities/Timeline';
import {
  createTimeline,
  addClipToTimeline,
  removeClipFromTimeline,
  moveClipInTimeline,
  getTimelineDuration,
  setTransition as setTimelineTransition,
  removeTransition as removeTimelineTransition,
  getTransitionBetween,
} from '@/domain/entities/Timeline';
import type { Transition, TransitionType } from '@/domain/entities/Transition';
import {
  createTransition,
  getMaxTransitionDuration,
  DEFAULT_TRANSITION_DURATION,
} from '@/domain/entities/Transition';
import type { EntityId, OperationStatus, Progress, Seconds, VideoMetadata } from '@/domain/types';

/**
 * Editor store state
 */
interface EditorState {
  // Clips
  clips: Map<EntityId, Clip>;

  // Timeline
  timeline: Timeline;

  // Playback
  currentTime: Seconds;
  isPlaying: boolean;

  // UI State
  selectedClipId: EntityId | null;

  // Operations
  importStatus: OperationStatus;
  exportStatus: OperationStatus;
  exportProgress: Progress | null;
}

/**
 * Editor store actions
 */
interface EditorActions {
  // Clip actions
  addClip: (params: {
    id: EntityId;
    name: string;
    sourceUrl: string;
    file: File;
    metadata: VideoMetadata;
    thumbnailUrl: string;
  }) => void;
  removeClip: (clipId: EntityId) => void;
  selectClip: (clipId: EntityId | null) => void;

  // Timeline actions
  moveClip: (clipId: EntityId, newIndex: number) => void;

  // Transition actions
  setTransition: (
    fromClipId: EntityId,
    toClipId: EntityId,
    type: TransitionType,
    duration?: Seconds
  ) => void;
  removeTransition: (fromClipId: EntityId, toClipId: EntityId) => void;
  getTransition: (fromClipId: EntityId, toClipId: EntityId) => Transition | null;

  // Playback actions
  play: () => void;
  pause: () => void;
  seek: (time: Seconds) => void;

  // Status actions
  setImportStatus: (status: OperationStatus) => void;
  setExportStatus: (status: OperationStatus) => void;
  setExportProgress: (progress: Progress | null) => void;

  // Computed
  getTotalDuration: () => Seconds;
  getClipsInOrder: () => Clip[];

  // Reset
  reset: () => void;
}

type EditorStore = EditorState & EditorActions;

/**
 * Initial state
 */
const initialState: EditorState = {
  clips: new Map(),
  timeline: createTimeline(),
  currentTime: 0,
  isPlaying: false,
  selectedClipId: null,
  importStatus: 'idle',
  exportStatus: 'idle',
  exportProgress: null,
};

/**
 * Editor store - manages all video editor state
 */
export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Clip actions
      addClip: (params) => {
        const clip = createClip(params);
        set((state) => ({
          clips: new Map(state.clips).set(clip.id, clip),
          timeline: addClipToTimeline(state.timeline, clip.id),
        }));
      },

      removeClip: (clipId) => {
        set((state) => {
          const newClips = new Map(state.clips);
          newClips.delete(clipId);
          return {
            clips: newClips,
            timeline: removeClipFromTimeline(state.timeline, clipId),
            selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
          };
        });
      },

      selectClip: (clipId) => {
        set({ selectedClipId: clipId });
      },

      // Timeline actions
      moveClip: (clipId, newIndex) => {
        set((state) => ({
          timeline: moveClipInTimeline(state.timeline, clipId, newIndex),
        }));
      },

      // Transition actions
      setTransition: (fromClipId, toClipId, type, duration) => {
        set((state) => {
          const fromClip = state.clips.get(fromClipId);
          const toClip = state.clips.get(toClipId);

          if (!fromClip || !toClip) {
            console.warn('Cannot set transition: clips not found');
            return state;
          }

          // Calculate valid duration
          const fromDuration = getClipDuration(fromClip);
          const toDuration = getClipDuration(toClip);
          const maxDuration = getMaxTransitionDuration(fromDuration, toDuration);
          const finalDuration = Math.min(duration ?? DEFAULT_TRANSITION_DURATION, maxDuration);

          const transition = createTransition({
            id: `transition_${fromClipId}_${toClipId}`,
            type,
            duration: finalDuration,
          });

          return {
            timeline: setTimelineTransition(state.timeline, fromClipId, toClipId, transition),
          };
        });
      },

      removeTransition: (fromClipId, toClipId) => {
        set((state) => ({
          timeline: removeTimelineTransition(state.timeline, fromClipId, toClipId),
        }));
      },

      getTransition: (fromClipId, toClipId) => {
        const state = get();
        return getTransitionBetween(state.timeline, fromClipId, toClipId);
      },

      // Playback actions
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      seek: (time) => set({ currentTime: Math.max(0, time) }),

      // Status actions
      setImportStatus: (status) => set({ importStatus: status }),
      setExportStatus: (status) => set({ exportStatus: status }),
      setExportProgress: (progress) => set({ exportProgress: progress }),

      // Computed
      getTotalDuration: () => {
        const state = get();
        return getTimelineDuration(state.timeline, state.clips);
      },

      getClipsInOrder: () => {
        const state = get();
        return state.timeline.clipIds
          .map((id) => state.clips.get(id))
          .filter((clip): clip is Clip => clip !== undefined);
      },

      // Reset
      reset: () => set(initialState),
    }),
    { name: 'editor-store' }
  )
);
