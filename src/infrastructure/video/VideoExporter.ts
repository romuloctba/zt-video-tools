import type { Clip } from '@/domain/entities/Clip';
import { getClipDuration } from '@/domain/entities/Clip';
import type { TextOverlay } from '@/domain/entities/TextOverlay';
import type { Progress } from '@/domain/types';
import { ExportError } from '@/domain/errors';
import { drawTextOverlay } from '@/shared/utils/canvas';

export interface ExportOptions {
  clips: Clip[];
  textOverlays: TextOverlay[];
  width: number;
  height: number;
  frameRate: number;
  onProgress?: (progress: Progress) => void;
}

/**
 * VideoExporter - Concatenates clips and exports using MediaRecorder
 * 
 * This is the key class that solves the audio concatenation problem:
 * 1. We render each video sequentially to a canvas
 * 2. We mix audio using AudioContext
 * 3. We capture both streams with MediaRecorder
 */
export class VideoExporter {
  /**
   * Exports concatenated clips to a video blob
   */
  static async export(options: ExportOptions): Promise<Blob> {
    const { clips, textOverlays, width, height, frameRate, onProgress } = options;

    if (clips.length === 0) {
      throw new ExportError('No clips to export');
    }

    // Calculate total duration
    const totalDuration = clips.reduce((sum, clip) => sum + getClipDuration(clip), 0);

    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Create audio context for mixing
    const audioContext = new AudioContext();
    const audioDestination = audioContext.createMediaStreamDestination();

    // Get canvas stream
    const canvasStream = canvas.captureStream(frameRate);

    // Combine video and audio streams
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks(),
    ]);

    // Setup MediaRecorder
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: this.getSupportedMimeType(),
      videoBitsPerSecond: 8_000_000, // 8 Mbps
    });

    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    // Start recording
    mediaRecorder.start(100); // Collect data every 100ms

    // Process each clip sequentially
    let processedTime = 0;

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];

      onProgress?.({
        current: i,
        total: clips.length,
        percentage: (processedTime / totalDuration) * 100,
        message: `Processing clip ${i + 1} of ${clips.length}: ${clip.name}`,
      });

      await this.renderClip(
        clip,
        textOverlays,
        processedTime,
        ctx,
        audioContext,
        audioDestination,
        width,
        height
      );

      processedTime += getClipDuration(clip);
    }

    // Stop recording
    mediaRecorder.stop();
    await audioContext.close();

    // Wait for all data to be collected
    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve();
    });

    onProgress?.({
      current: clips.length,
      total: clips.length,
      percentage: 100,
      message: 'Export complete!',
    });

    // Create final blob
    return new Blob(chunks, { type: this.getSupportedMimeType() });
  }

  /**
   * Renders a single clip to the canvas and plays its audio
   */
  private static async renderClip(
    clip: Clip,
    textOverlays: TextOverlay[],
    clipStartTime: number,
    ctx: CanvasRenderingContext2D,
    audioContext: AudioContext,
    audioDestination: MediaStreamAudioDestinationNode,
    width: number,
    height: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = clip.sourceUrl;
      video.muted = false;
      video.playsInline = true;

      const startTime = clip.trimStart;
      const endTime = clip.trimEnd;

      // Connect video audio to our audio destination
      const source = audioContext.createMediaElementSource(video);
      source.connect(audioDestination);


      video.onloadeddata = async () => {
        video.currentTime = startTime;

        try {
          await video.play();
        } catch (error) {
          reject(new ExportError('Failed to play video during export', error as Error));
          return;
        }

        // Render frames
        const renderFrame = () => {
          if (video.currentTime >= endTime || video.ended) {
            video.pause();
            source.disconnect();
            resolve();
            return;
          }

          // Draw video frame to canvas (with scaling)
          this.drawVideoToCanvas(video, ctx, width, height);

          // Draw active text overlays
          const currentGlobalTime = clipStartTime + (video.currentTime - clip.trimStart);
          textOverlays.forEach((overlay) => {
            if (
              currentGlobalTime >= overlay.startTime &&
              currentGlobalTime <= overlay.endTime
            ) {
              drawTextOverlay(ctx, width, height, overlay);
            }
          });

          requestAnimationFrame(renderFrame);
        };

        renderFrame();
      };

      video.onerror = () => {
        reject(new ExportError(`Failed to load clip: ${clip.name}`));
      };
    });
  }

  /**
   * Draws video frame to canvas with proper scaling
   */
  private static drawVideoToCanvas(
    video: HTMLVideoElement,
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = canvasWidth / canvasHeight;

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    // Fit video within canvas (letterboxing)
    if (videoAspect > canvasAspect) {
      // Video is wider - letterbox top/bottom
      drawHeight = canvasWidth / videoAspect;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      // Video is taller - letterbox left/right
      drawWidth = canvasHeight * videoAspect;
      offsetX = (canvasWidth - drawWidth) / 2;
    }

    // Clear canvas (black background)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw video
    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
  }

  /**
   * Gets the best supported MIME type for recording
   */
  private static getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    throw new ExportError('No supported video format found');
  }

  /**
   * Downloads a blob as a file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
