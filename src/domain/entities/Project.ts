import type { Clip } from './Clip';
import type { Timeline } from './Timeline';
import { createTimeline, getTimelineDuration } from './Timeline';
import type { EntityId, ExportSettings, Seconds } from '../types';

/**
 * Represents the root aggregate for a video editing project
 * Contains all clips and the timeline arrangement
 */
export interface Project {
  /** Project identifier */
  readonly id: EntityId;

  /** Project name */
  readonly name: string;

  /** All clips in the project (keyed by ID) */
  readonly clips: Map<EntityId, Clip>;

  /** The timeline arrangement */
  readonly timeline: Timeline;

  /** Export settings */
  readonly exportSettings: ExportSettings;

  /** Last modified timestamp */
  readonly updatedAt: Date;

  /** Creation timestamp */
  readonly createdAt: Date;
}

/**
 * Default export settings
 */
export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  format: 'webm',
  quality: 'high',
  dimensions: { width: 1920, height: 1080 },
  frameRate: 30,
};

/**
 * Creates a new project
 */
export function createProject(params: {
  id: EntityId;
  name: string;
}): Project {
  return {
    id: params.id,
    name: params.name,
    clips: new Map(),
    timeline: createTimeline(),
    exportSettings: DEFAULT_EXPORT_SETTINGS,
    updatedAt: new Date(),
    createdAt: new Date(),
  };
}

/**
 * Gets the total duration of the project
 */
export function getProjectDuration(project: Project): Seconds {
  return getTimelineDuration(project.timeline, project.clips);
}

/**
 * Checks if the project is empty (no clips)
 */
export function isProjectEmpty(project: Project): boolean {
  return project.clips.size === 0;
}

/**
 * Gets all clips in timeline order
 */
export function getClipsInOrder(project: Project): Clip[] {
  return project.timeline.clipIds
    .map((id) => project.clips.get(id))
    .filter((clip): clip is Clip => clip !== undefined);
}
