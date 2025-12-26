import { useCallback, useRef, useState } from 'react';
import { useEditorStore } from '@/application/store/editorStore';

interface PreviewInteractionLayerProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

/**
 * PreviewInteractionLayer - Transparent layer over the canvas for direct manipulation
 */
export function PreviewInteractionLayer({ canvasRef }: PreviewInteractionLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectedId = useEditorStore((s) => s.selectedTextOverlayId);
  const overlay = useEditorStore((s) => 
    selectedId ? s.textOverlays.get(selectedId) : null
  );
  const updateTextOverlay = useEditorStore((s) => s.updateTextOverlay);
  const currentTime = useEditorStore((s) => s.currentTime);

  // Only show if an overlay is selected and active at current time
  const isActive = overlay && currentTime >= overlay.startTime && currentTime <= overlay.endTime;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isActive || !containerRef.current) return;
    
    // Start dragging
    setIsDragging(true);
    containerRef.current.setPointerCapture(e.pointerId);
  }, [isActive]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !selectedId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    
    // Calculate normalized coordinates relative to the canvas
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Clamp to 0-1
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    updateTextOverlay(selectedId, { x: clampedX, y: clampedY });
  }, [isDragging, selectedId, updateTextOverlay, canvasRef]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    setIsDragging(false);
    containerRef.current.releasePointerCapture(e.pointerId);
  }, [isDragging]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-20 cursor-move touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Selection Bounding Box */}
      <div
        className="absolute border-2 border-indigo-500 border-dashed pointer-events-none flex items-center justify-center"
        style={{
          left: `${overlay.x * 100}%`,
          top: `${overlay.y * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: '160px', // Approximate width for feedback
          height: '48px',  // Approximate height for feedback
        }}
      >
        {/* Corner Handles */}
        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-indigo-500 rounded-full border border-white shadow-sm" />
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-indigo-500 rounded-full border border-white shadow-sm" />
        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-indigo-500 rounded-full border border-white shadow-sm" />
        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-indigo-500 rounded-full border border-white shadow-sm" />
        
        {/* Center Dot */}
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
      </div>
    </div>
  );
}
