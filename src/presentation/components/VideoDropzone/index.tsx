import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react';
import { useVideoImport } from '@/application/hooks/useVideoImport';
import { VIDEO_ACCEPT } from '@/shared/utils/file';

/**
 * VideoDropzone - Drag & drop area for importing video files
 */
export function VideoDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { importFiles } = useVideoImport();
  
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    try {
      await importFiles(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import files');
    }
  }, [importFiles]);
  
  const handleFileInput = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      await importFiles(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import files');
    }
    
    // Reset input
    e.target.value = '';
  }, [importFiles]);
  
  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        p-2 border-2 border-dashed rounded-lg
        transition-colors duration-200 cursor-pointer
        h-42
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-500/10' 
          : 'border-zinc-600 hover:border-zinc-500 bg-zinc-800/50'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={VIDEO_ACCEPT}
        multiple
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <svg 
        className={`w-12 h-12 mb-4 ${isDragging ? 'text-indigo-400' : 'text-zinc-500'}`}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
        />
      </svg>
      
      <p className={`text-sm font-medium leading-tight ${isDragging ? 'text-indigo-300' : 'text-zinc-300'}`}>
        {isDragging ? 'Drop videos here' : 'Drop videos or click to browse'}
      </p>
      
      <p className="mt-2 text-sm text-zinc-500">
        Supports MP4, WebM, MOV, AVI, MKV
      </p>
      
      {error && (
        <p className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
