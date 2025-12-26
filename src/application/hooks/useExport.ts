import { useCallback } from 'react';
import { useEditorStore } from '@/application/store/editorStore';
import { VideoExporter } from '@/infrastructure/video/VideoExporter';
import { DEFAULT_EXPORT_WIDTH, DEFAULT_EXPORT_HEIGHT, DEFAULT_EXPORT_FRAME_RATE } from '@/shared/constants';

/**
 * Hook for handling video export
 */
export function useExport() {
  const { getClipsInOrder, textOverlays, setExportStatus, setExportProgress } = useEditorStore();

  const exportVideo = useCallback(async (filename: string = 'exported-video.webm') => {
    const clips = getClipsInOrder();
    const overlays = Array.from(textOverlays.values());

    if (clips.length === 0) {
      throw new Error('No clips to export');
    }

    setExportStatus('loading');
    setExportProgress({
      current: 0,
      total: clips.length,
      percentage: 0,
      message: 'Starting export...',
    });

    try {
      const blob = await VideoExporter.export({
        clips,
        textOverlays: overlays,
        width: DEFAULT_EXPORT_WIDTH,
        height: DEFAULT_EXPORT_HEIGHT,
        frameRate: DEFAULT_EXPORT_FRAME_RATE,
        onProgress: setExportProgress,
      });

      VideoExporter.downloadBlob(blob, filename);

      setExportStatus('success');
      setExportProgress(null);
    } catch (error) {
      setExportStatus('error');
      setExportProgress(null);
      throw error;
    }
  }, [getClipsInOrder, textOverlays, setExportStatus, setExportProgress]);

  return { exportVideo };
}
