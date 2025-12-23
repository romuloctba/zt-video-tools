import type { Clip } from './Clip';
import { getClipDuration } from './Clip';
import type { EntityId, Seconds } from '../types';

/**
 * Represents the timeline containing ordered clips
 * The timeline is the main editing surface where clips are arranged
 */
export interface Timeline {
  /** Ordered list of clip IDs (order matters for concatenation) */
  readonly clipIds: readonly EntityId[];
}

/**
 * Creates an empty timeline
 */
export function createTimeline(): Timeline {
  return {
    clipIds: [],
  };
}

/**
 * Adds a clip to the end of the timeline
 */
export function addClipToTimeline(timeline: Timeline, clipId: EntityId): Timeline {
  return {
    ...timeline,
    clipIds: [...timeline.clipIds, clipId],
  };
}

/**
 * Removes a clip from the timeline
 */
export function removeClipFromTimeline(timeline: Timeline, clipId: EntityId): Timeline {
  return {
    ...timeline,
    clipIds: timeline.clipIds.filter((id) => id !== clipId),
  };
}

/**
 * Moves a clip to a new position in the timeline
 */
export function moveClipInTimeline(
  timeline: Timeline,
  clipId: EntityId,
  newIndex: number
): Timeline {
  const currentIndex = timeline.clipIds.indexOf(clipId);
  if (currentIndex === -1) {
    throw new Error(`Clip ${clipId} not found in timeline`);
  }

  const newClipIds = [...timeline.clipIds];
  newClipIds.splice(currentIndex, 1);
  newClipIds.splice(newIndex, 0, clipId);

  return {
    ...timeline,
    clipIds: newClipIds,
  };
}

/**
 * Calculates the total duration of the timeline
 */
export function getTimelineDuration(timeline: Timeline, clips: Map<EntityId, Clip>): Seconds {
  return timeline.clipIds.reduce((total, clipId) => {
    const clip = clips.get(clipId);
    if (!clip) return total;
    return total + getClipDuration(clip);
  }, 0);
}

/**
 * Gets the clip at a specific time position in the timeline
 * Returns the clip and the relative time within that clip
 */
export function getClipAtTime(
  timeline: Timeline,
  clips: Map<EntityId, Clip>,
  time: Seconds
): { clip: Clip; relativeTime: Seconds } | null {
  let accumulatedTime = 0;

  for (const clipId of timeline.clipIds) {
    const clip = clips.get(clipId);
    if (!clip) continue;

    const clipDuration = getClipDuration(clip);

    if (time < accumulatedTime + clipDuration) {
      return {
        clip,
        relativeTime: clip.trimStart + (time - accumulatedTime),
      };
    }

    accumulatedTime += clipDuration;
  }

  return null;
}
