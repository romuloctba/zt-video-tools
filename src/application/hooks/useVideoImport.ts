import { useCallback } from 'react';
import { useEditorStore } from '@/application/store/editorStore';
import { VideoDecoder } from '@/infrastructure/video/VideoDecoder';
import { generateId, getFileNameWithoutExtension, isVideoFile } from '@/shared/utils';

/**
 * Hook for handling video file imports
 */
export function useVideoImport() {
  const { addClip, setImportStatus } = useEditorStore();

  const importFile = useCallback(async (file: File) => {
    if (!isVideoFile(file)) {
      throw new Error(`Invalid file type: ${file.type}`);
    }

    // Extract metadata
    const metadata = await VideoDecoder.getMetadata(file);

    // Generate thumbnail
    const thumbnailUrl = await VideoDecoder.generateThumbnail(file, 0.5);

    // Create object URL for playback
    const sourceUrl = URL.createObjectURL(file);

    // Add clip to store
    addClip({
      id: generateId(),
      name: getFileNameWithoutExtension(file.name),
      sourceUrl,
      file,
      metadata,
      thumbnailUrl,
    });
  }, [addClip]);

  const importFiles = useCallback(async (files: FileList | File[]) => {
    setImportStatus('loading');

    try {
      const fileArray = Array.from(files);
      const videoFiles = fileArray.filter(isVideoFile);

      if (videoFiles.length === 0) {
        throw new Error('No valid video files selected');
      }

      // Import files sequentially to avoid overwhelming the browser
      for (const file of videoFiles) {
        await importFile(file);
      }

      setImportStatus('success');
    } catch (error) {
      setImportStatus('error');
      throw error;
    }
  }, [importFile, setImportStatus]);

  return { importFile, importFiles };
}
