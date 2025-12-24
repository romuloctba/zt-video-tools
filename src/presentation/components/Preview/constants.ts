/**
 * Preview component constants
 * Centralizes magic numbers for better maintainability
 */

// =============================================================================
// Timing Thresholds
// =============================================================================

/** Maximum drift (in seconds) before correcting video position during transitions */
export const SYNC_DRIFT_THRESHOLD = 0.15;

/** Threshold (in seconds) for detecting clip is about to end */
export const CLIP_END_THRESHOLD = 0.05;

/** Threshold (in seconds) for detecting timeline end */
export const TIMELINE_END_THRESHOLD = 0.01;

/** Small offset to advance past clip boundary */
export const CLIP_BOUNDARY_OFFSET = 0.001;

/** Interval (in ms) between timeline state updates (~20fps) */
export const STATE_UPDATE_INTERVAL_MS = 50;

// =============================================================================
// Canvas Dimensions
// =============================================================================

/** Default canvas width (16:9 aspect ratio) */
export const DEFAULT_CANVAS_WIDTH = 854;

/** Default canvas height (16:9 aspect ratio) */
export const DEFAULT_CANVAS_HEIGHT = 480;

// =============================================================================
// Video Element
// =============================================================================

/** Minimum video readyState to draw frames (HAVE_CURRENT_DATA) */
export const MIN_VIDEO_READY_STATE = 2;

// =============================================================================
// Transition
// =============================================================================

/** Midpoint for fade-through transitions (fadeToBlack, fadeToWhite) */
export const TRANSITION_MIDPOINT = 0.5;

// =============================================================================
// Colors
// =============================================================================

export const CANVAS_BACKGROUND_COLOR = '#000000';
export const CANVAS_PLACEHOLDER_COLOR = '#3f3f46';
export const FADE_WHITE_COLOR = '#ffffff';

// =============================================================================
// Typography
// =============================================================================

export const PLACEHOLDER_FONT = '16px system-ui';
