/**
 * Core domain types for the video editor
 * These types are framework-agnostic and represent the business domain
 */

/** Unique identifier for entities */
export type EntityId = string;

/** Time in seconds */
export type Seconds = number;

/** Video dimensions */
export interface Dimensions {
  width: number;
  height: number;
}

/** Represents metadata extracted from a video file */
export interface VideoMetadata {
  duration: Seconds;
  dimensions: Dimensions;
  frameRate: number;
  codec: string;
  hasAudio: boolean;
}

/** Status of async operations */
export type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

/** Export settings for the final video */
export interface ExportSettings {
  format: 'webm' | 'mp4';
  quality: 'low' | 'medium' | 'high';
  dimensions: Dimensions;
  frameRate: number;
}

/** Progress information for long-running operations */
export interface Progress {
  current: number;
  total: number;
  percentage: number;
  message?: string;
}
