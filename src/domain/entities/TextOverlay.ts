import type { EntityId, Seconds } from '../types';

/**
 * Represents a text overlay on the video
 */
export interface TextOverlay {
  readonly id: EntityId;
  readonly text: string;
  readonly x: number; // Normalized 0-1
  readonly y: number; // Normalized 0-1
  readonly fontSize: number; // Base size in pixels (will be scaled)
  readonly fontFamily: string;
  readonly fontWeight: 'normal' | 'bold';
  readonly fontStyle: 'normal' | 'italic';
  readonly color: string;
  readonly startTime: Seconds;
  readonly endTime: Seconds;
}

/**
 * Creates a new TextOverlay entity
 */
export function createTextOverlay(params: {
  id: EntityId;
  text: string;
  x?: number;
  y?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  startTime: Seconds;
  endTime: Seconds;
}): TextOverlay {
  return {
    id: params.id,
    text: params.text,
    x: params.x ?? 0.5,
    y: params.y ?? 0.5,
    fontSize: params.fontSize ?? 32,
    fontFamily: params.fontFamily ?? 'Arial',
    fontWeight: params.fontWeight ?? 'normal',
    fontStyle: params.fontStyle ?? 'normal',
    color: params.color ?? '#ffffff',
    startTime: params.startTime,
    endTime: params.endTime,
  };
}
