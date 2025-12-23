import type { Clip } from './Clip';
import { getClipDuration } from './Clip';
import type { Transition } from './Transition';
import { createTransitionKey } from './Transition';
import type { EntityId, Seconds } from '../types';

/**
 * Represents the timeline containing ordered clips and transitions
 * The timeline is the main editing surface where clips are arranged
 */
export interface Timeline {
  /** Ordered list of clip IDs (order matters for concatenation) */
  readonly clipIds: readonly EntityId[];

  /**
   * Transitions between clips
   * Key format: "fromClipId_toClipId"
   */
  readonly transitions: ReadonlyMap<string, Transition>;
}

/**
 * Result when querying what's at a specific timeline position
 */
export type TimelinePositionResult =
  | { type: 'empty' }
  | { type: 'single'; clip: Clip; relativeTime: Seconds }
  | {
    type: 'transition';
    outgoing: { clip: Clip; relativeTime: Seconds };
    incoming: { clip: Clip; relativeTime: Seconds };
    transition: Transition;
    /** Progress of the transition from 0.0 (start) to 1.0 (end) */
    progress: number;
  };

/**
 * Creates an empty timeline
 */
export function createTimeline(): Timeline {
  return {
    clipIds: [],
    transitions: new Map(),
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
 * Removes a clip from the timeline and any associated transitions
 */
export function removeClipFromTimeline(timeline: Timeline, clipId: EntityId): Timeline {
  const newTransitions = new Map(timeline.transitions);

  // Remove transitions involving this clip
  for (const key of newTransitions.keys()) {
    if (key.includes(clipId)) {
      newTransitions.delete(key);
    }
  }

  return {
    ...timeline,
    clipIds: timeline.clipIds.filter((id) => id !== clipId),
    transitions: newTransitions,
  };
}

/**
 * Moves a clip to a new position in the timeline
 * Note: This invalidates transitions involving the moved clip
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

  // Remove transitions involving the moved clip (positions changed)
  const newTransitions = new Map(timeline.transitions);
  for (const key of newTransitions.keys()) {
    if (key.includes(clipId)) {
      newTransitions.delete(key);
    }
  }

  return {
    ...timeline,
    clipIds: newClipIds,
    transitions: newTransitions,
  };
}

/**
 * Sets a transition between two adjacent clips
 */
export function setTransition(
  timeline: Timeline,
  fromClipId: EntityId,
  toClipId: EntityId,
  transition: Transition
): Timeline {
  // Validate that clips are adjacent
  const fromIndex = timeline.clipIds.indexOf(fromClipId);
  const toIndex = timeline.clipIds.indexOf(toClipId);

  if (fromIndex === -1 || toIndex === -1) {
    throw new Error('Both clips must exist in timeline');
  }

  if (toIndex !== fromIndex + 1) {
    throw new Error('Clips must be adjacent to have a transition');
  }

  const key = createTransitionKey(fromClipId, toClipId);
  const newTransitions = new Map(timeline.transitions);
  newTransitions.set(key, transition);

  return {
    ...timeline,
    transitions: newTransitions,
  };
}

/**
 * Removes a transition between two clips
 */
export function removeTransition(
  timeline: Timeline,
  fromClipId: EntityId,
  toClipId: EntityId
): Timeline {
  const key = createTransitionKey(fromClipId, toClipId);
  const newTransitions = new Map(timeline.transitions);
  newTransitions.delete(key);

  return {
    ...timeline,
    transitions: newTransitions,
  };
}

/**
 * Gets the transition between two clips, if any
 */
export function getTransitionBetween(
  timeline: Timeline,
  fromClipId: EntityId,
  toClipId: EntityId
): Transition | null {
  const key = createTransitionKey(fromClipId, toClipId);
  return timeline.transitions.get(key) ?? null;
}

/**
 * Calculates the total duration of the timeline, accounting for transition overlaps
 * Transitions reduce total duration because clips overlap during transitions
 */
export function getTimelineDuration(
  timeline: Timeline,
  clips: Map<EntityId, Clip>
): Seconds {
  let totalDuration = 0;

  for (let i = 0; i < timeline.clipIds.length; i++) {
    const clipId = timeline.clipIds[i];
    const clip = clips.get(clipId);
    if (!clip) continue;

    totalDuration += getClipDuration(clip);

    // Subtract transition overlap with next clip
    if (i < timeline.clipIds.length - 1) {
      const nextClipId = timeline.clipIds[i + 1];
      const transitionKey = createTransitionKey(clipId, nextClipId);
      const transition = timeline.transitions.get(transitionKey);

      if (transition) {
        // Transition creates overlap, reducing total duration
        totalDuration -= transition.duration;
      }
    }
  }

  return Math.max(0, totalDuration);
}

/**
 * Gets information about what's playing at a specific timeline position
 * Handles single clips, transitions (overlapping clips), or empty timeline
 */
export function getClipAtTime(
  timeline: Timeline,
  clips: Map<EntityId, Clip>,
  time: Seconds
): TimelinePositionResult {
  if (timeline.clipIds.length === 0) {
    return { type: 'empty' };
  }

  // Build a timeline map with positions accounting for transitions
  const clipPositions = calculateClipPositions(timeline, clips);

  // Find what's at the given time
  for (let i = 0; i < clipPositions.length; i++) {
    const pos = clipPositions[i];
    const clip = clips.get(pos.clipId);
    if (!clip) continue;

    const clipEnd = pos.startInTimeline + getClipDuration(clip);

    // Check if we're in a transition zone with the next clip
    if (i < clipPositions.length - 1) {
      const nextPos = clipPositions[i + 1];
      const nextClip = clips.get(nextPos.clipId);
      const transitionKey = createTransitionKey(pos.clipId, nextPos.clipId);
      const transition = timeline.transitions.get(transitionKey);

      if (transition && nextClip) {
        // Transition zone starts when the next clip starts (overlap region)
        const transitionStart = nextPos.startInTimeline;

        // Are we in the transition zone? (between next clip start and current clip end)
        if (time >= transitionStart && time < clipEnd) {
          const transitionProgress = (time - transitionStart) / transition.duration;

          // Calculate relative times within each clip
          const outgoingRelativeTime = clip.trimStart + (time - pos.startInTimeline);
          const incomingRelativeTime = nextClip.trimStart + (time - nextPos.startInTimeline);

          return {
            type: 'transition',
            outgoing: { clip, relativeTime: outgoingRelativeTime },
            incoming: { clip: nextClip, relativeTime: incomingRelativeTime },
            transition,
            progress: Math.min(1, Math.max(0, transitionProgress)),
          };
        }
      }
    }

    // Regular single clip playback
    if (time >= pos.startInTimeline && time < clipEnd) {
      const relativeTime = clip.trimStart + (time - pos.startInTimeline);
      return {
        type: 'single',
        clip,
        relativeTime,
      };
    }
  }

  return { type: 'empty' };
}

/**
 * Legacy function for backward compatibility
 * Returns simple clip info without transition details
 */
export function getSimpleClipAtTime(
  timeline: Timeline,
  clips: Map<EntityId, Clip>,
  time: Seconds
): { clip: Clip; relativeTime: Seconds } | null {
  const result = getClipAtTime(timeline, clips, time);

  if (result.type === 'single') {
    return { clip: result.clip, relativeTime: result.relativeTime };
  }

  if (result.type === 'transition') {
    // Return the outgoing clip during transitions for simple queries
    return {
      clip: result.outgoing.clip,
      relativeTime: result.outgoing.relativeTime,
    };
  }

  return null;
}

/**
 * Calculates the start position of each clip in the timeline
 * Accounts for transition overlaps
 */
export function calculateClipPositions(
  timeline: Timeline,
  clips: Map<EntityId, Clip>
): Array<{ clipId: EntityId; startInTimeline: Seconds }> {
  const positions: Array<{ clipId: EntityId; startInTimeline: Seconds }> = [];
  let currentTime = 0;

  for (let i = 0; i < timeline.clipIds.length; i++) {
    const clipId = timeline.clipIds[i];
    const clip = clips.get(clipId);
    if (!clip) continue;

    positions.push({ clipId, startInTimeline: currentTime });

    // Advance time by clip duration
    currentTime += getClipDuration(clip);

    // Subtract transition overlap with next clip
    if (i < timeline.clipIds.length - 1) {
      const nextClipId = timeline.clipIds[i + 1];
      const transitionKey = createTransitionKey(clipId, nextClipId);
      const transition = timeline.transitions.get(transitionKey);

      if (transition) {
        currentTime -= transition.duration;
      }
    }
  }

  return positions;
}

/**
 * Gets the start time of a specific clip in the timeline
 */
export function getClipStartTime(
  timeline: Timeline,
  clips: Map<EntityId, Clip>,
  targetClipId: EntityId
): Seconds {
  const positions = calculateClipPositions(timeline, clips);
  const pos = positions.find((p) => p.clipId === targetClipId);
  return pos?.startInTimeline ?? 0;
}
