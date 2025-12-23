import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Clip } from '@/domain/entities/Clip';
import { createClip } from '@/domain/entities/Clip';
import type { Timeline } from '@/domain/entities/Timeline';
import {
  createTimeline,
  addClipToTimeline,
  removeClipFromTimeline,
  moveClipInTimeline,
  getTimelineDuration,
} from '@/domain/entities/Timeline';
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
