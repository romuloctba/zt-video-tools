import type { EntityId, Seconds, VideoMetadata } from '../types';

/**
 * Represents a video clip in the timeline
 * A clip is an immutable reference to a video file with trim points
 */
export interface Clip {
  /** Unique identifier */
  readonly id: EntityId;

  /** Display name (usually filename without extension) */
  readonly name: string;

  /** Reference to the source file (Object URL or IndexedDB key) */
  readonly sourceUrl: string;

  /** Original file reference for re-reading */
  readonly file: File;

  /** Video metadata */
  readonly metadata: VideoMetadata;

  /** Thumbnail data URL for display in timeline */
  readonly thumbnailUrl: string;

  /** Start time within the source video (for trimming) */
  readonly trimStart: Seconds;

  /** End time within the source video (for trimming) */
  readonly trimEnd: Seconds;

  /** Timestamp when the clip was added */
  readonly createdAt: Date;
}

/**
 * Creates a new Clip entity
 */
export function createClip(params: {
  id: EntityId;
  name: string;
  sourceUrl: string;
  file: File;
  metadata: VideoMetadata;
  thumbnailUrl: string;
}): Clip {
  return {
    id: params.id,
    name: params.name,
    sourceUrl: params.sourceUrl,
    file: params.file,
    metadata: params.metadata,
    thumbnailUrl: params.thumbnailUrl,
    trimStart: 0,
    trimEnd: params.metadata.duration,
    createdAt: new Date(),
  };
}

/**
 * Returns the effective duration of a clip (considering trim points)
 */
export function getClipDuration(clip: Clip): Seconds {
  return clip.trimEnd - clip.trimStart;
}

/**
 * Creates a new clip with updated trim points
 */
export function trimClip(clip: Clip, trimStart: Seconds, trimEnd: Seconds): Clip {
  if (trimStart < 0) {
    throw new Error('Trim start cannot be negative');
  }
  if (trimEnd > clip.metadata.duration) {
    throw new Error('Trim end cannot exceed video duration');
  }
  if (trimStart >= trimEnd) {
    throw new Error('Trim start must be less than trim end');
  }

  return {
    ...clip,
    trimStart,
    trimEnd,
  };
}
