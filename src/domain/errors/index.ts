/**
 * Base class for domain-specific errors
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

/**
 * Error thrown when a video file cannot be processed
 */
export class VideoProcessingError extends DomainError {
  readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'VideoProcessingError';
    this.cause = cause;
  }
}

/**
 * Error thrown when video export fails
 */
export class ExportError extends DomainError {
  readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ExportError';
    this.cause = cause;
  }
}

/**
 * Error thrown when a clip is not found
 */
export class ClipNotFoundError extends DomainError {
  constructor(clipId: string) {
    super(`Clip with ID "${clipId}" not found`);
    this.name = 'ClipNotFoundError';
  }
}

/**
 * Error thrown when browser doesn't support required APIs
 */
export class UnsupportedBrowserError extends DomainError {
  constructor(feature: string) {
    super(`Your browser does not support ${feature}. Please use a modern browser like Chrome, Edge, or Safari.`);
    this.name = 'UnsupportedBrowserError';
  }
}
