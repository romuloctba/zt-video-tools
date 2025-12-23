import type { EntityId, Seconds } from '../types';

/**
 * Available transition types between clips
 */
export type TransitionType = 'none' | 'crossfade' | 'fadeToBlack' | 'fadeToWhite';

/**
 * Represents a transition between two clips
 * Transitions create an overlap where both clips play simultaneously
 */
export interface Transition {
  /** Unique identifier */
  readonly id: EntityId;

  /** Type of visual transition effect */
  readonly type: TransitionType;

  /**
   * Total transition duration in seconds
   * Half comes from the outgoing clip, half from the incoming clip
   * e.g., 2.0s transition = 1.0s from end of clip A + 1.0s from start of clip B
   */
  readonly duration: Seconds;
}

/**
 * Default transition durations available to users
 */
export const TRANSITION_DURATIONS: readonly Seconds[] = [0.5, 1.0, 1.5, 2.0] as const;

/**
 * Default transition duration
 */
export const DEFAULT_TRANSITION_DURATION: Seconds = 1.0;

/**
 * Creates a new Transition entity
 */
export function createTransition(params: {
  id: EntityId;
  type: TransitionType;
  duration?: Seconds;
}): Transition {
  return {
    id: params.id,
    type: params.type,
    duration: params.duration ?? DEFAULT_TRANSITION_DURATION,
  };
}

/**
 * Creates a transition key from two adjacent clip IDs
 * The key represents the transition point between clips
 */
export function createTransitionKey(fromClipId: EntityId, toClipId: EntityId): string {
  return `${fromClipId}_${toClipId}`;
}

/**
 * Parses a transition key back to clip IDs
 */
export function parseTransitionKey(key: string): { fromClipId: EntityId; toClipId: EntityId } | null {
  const parts = key.split('_');
  if (parts.length !== 2) return null;
  return { fromClipId: parts[0], toClipId: parts[1] };
}

/**
 * Updates a transition with new values
 */
export function updateTransition(
  transition: Transition,
  updates: Partial<Pick<Transition, 'type' | 'duration'>>
): Transition {
  return {
    ...transition,
    ...updates,
  };
}

/**
 * Calculates the overlap time for each clip in a transition
 * Each clip contributes half of the transition duration
 */
export function getTransitionOverlap(transition: Transition): {
  outgoingOverlap: Seconds;
  incomingOverlap: Seconds;
} {
  const half = transition.duration / 2;
  return {
    outgoingOverlap: half,
    incomingOverlap: half,
  };
}

/**
 * Validates that a transition duration is valid for two clips
 * Transition cannot be longer than either clip's effective duration
 */
export function isValidTransitionDuration(
  duration: Seconds,
  outgoingClipDuration: Seconds,
  incomingClipDuration: Seconds
): boolean {
  const halfDuration = duration / 2;
  return halfDuration <= outgoingClipDuration && halfDuration <= incomingClipDuration;
}

/**
 * Calculates the maximum allowed transition duration for two clips
 */
export function getMaxTransitionDuration(
  outgoingClipDuration: Seconds,
  incomingClipDuration: Seconds
): Seconds {
  // Each clip must provide half the transition, so max is 2x the shorter clip
  return Math.min(outgoingClipDuration, incomingClipDuration) * 2;
}
