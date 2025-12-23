import type { VideoMetadata } from '@/domain/types';
import { VideoProcessingError } from '@/domain/errors';
import { THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT } from '@/shared/constants';

/**
 * VideoDecoder - Extracts metadata and frames from video files
 * Uses native browser APIs (HTMLVideoElement, Canvas)
 */
export class VideoDecoder {
  /**
   * Extracts metadata from a video file
   */
  static async getMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const objectUrl = URL.createObjectURL(file);

      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const metadata: VideoMetadata = {
          duration: video.duration,
          dimensions: {
            width: video.videoWidth,
            height: video.videoHeight,
          },
          frameRate: 30, // Default, as browsers don't expose this directly
          codec: file.type,
          hasAudio: this.hasAudioTrack(),
        };

        URL.revokeObjectURL(objectUrl);
        resolve(metadata);
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new VideoProcessingError(`Failed to load video: ${file.name}`));
      };

      video.src = objectUrl;
    });
  }

  /**
   * Generates a thumbnail from a video file
   */
  static async generateThumbnail(file: File, time: number = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const objectUrl = URL.createObjectURL(file);

      if (!ctx) {
        reject(new VideoProcessingError('Canvas context not available'));
        return;
      }

      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        // Seek to the specified time (or 0 if not specified)
        video.currentTime = Math.min(time, video.duration);
      };

      video.onseeked = () => {
        // Calculate thumbnail dimensions maintaining aspect ratio
        const aspectRatio = video.videoWidth / video.videoHeight;
        let width = THUMBNAIL_WIDTH;
        let height = THUMBNAIL_HEIGHT;

        if (aspectRatio > THUMBNAIL_WIDTH / THUMBNAIL_HEIGHT) {
          height = width / aspectRatio;
        } else {
          width = height * aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(video, 0, 0, width, height);

        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(objectUrl);
        resolve(thumbnailUrl);
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new VideoProcessingError(`Failed to generate thumbnail for: ${file.name}`));
      };

      video.src = objectUrl;
    });
  }

  /**
   * Creates a video element ready for playback
   */
  static createVideoElement(file: File): HTMLVideoElement {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.preload = 'auto';
    return video;
  }

  /**
   * Checks if video has audio tracks (heuristic)
   */
  private static hasAudioTrack(): boolean {
    // This is a heuristic - browsers don't directly expose audio track info
    // For MediaSource-based detection, we'd need more complex logic
    return true; // Assume videos have audio
  }
}
