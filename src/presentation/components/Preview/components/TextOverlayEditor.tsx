import { useEditorStore } from '@/application/store/editorStore';
import type { TextOverlay } from '@/domain/entities/TextOverlay';
import { formatTime } from '@/shared/utils/time';

/**
 * TextOverlayEditor - UI for editing text overlay properties
 */
export function TextOverlayEditor() {
  const selectedId = useEditorStore((s) => s.selectedTextOverlayId);
  const overlay = useEditorStore((s) => 
    selectedId ? s.textOverlays.get(selectedId) : null
  );
  const updateTextOverlay = useEditorStore((s) => s.updateTextOverlay);
  const removeTextOverlay = useEditorStore((s) => s.removeTextOverlay);
  const selectTextOverlay = useEditorStore((s) => s.selectTextOverlay);
  const totalDuration = useEditorStore((s) => s.getTotalDuration());

  if (!overlay) return null;

  const handleChange = (updates: Partial<TextOverlay>) => {
    if (selectedId) {
      updateTextOverlay(selectedId, updates);
    }
  };

  return (
    <div className="absolute top-4 right-4 w-64 bg-zinc-800/90 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-zinc-700 z-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Edit Text</h3>
        <button
          onClick={() => selectTextOverlay(null)}
          className="text-zinc-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {/* Text Content */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Text</label>
          <input
            type="text"
            value={overlay.text}
            onChange={(e) => handleChange({ text: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">X Position</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={overlay.x}
              onChange={(e) => handleChange({ x: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Y Position</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={overlay.y}
              onChange={(e) => handleChange({ y: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* Font Size & Color */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Size</label>
            <input
              type="number"
              value={overlay.fontSize}
              onChange={(e) => handleChange({ fontSize: parseInt(e.target.value) || 12 })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Color</label>
            <input
              type="color"
              value={overlay.color}
              onChange={(e) => handleChange({ color: e.target.value })}
              className="w-full h-8 bg-zinc-900 border border-zinc-700 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Timing */}
        <div className="space-y-2 pt-2 border-t border-zinc-700">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400">Timing</label>
            <span className="text-[10px] text-zinc-500 font-mono">
              Duration: {(overlay.endTime - overlay.startTime).toFixed(1)}s
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Start: {formatTime(overlay.startTime)}</label>
              <input
                type="range"
                min={0}
                max={overlay.endTime - 0.1}
                step={0.1}
                value={overlay.startTime}
                onChange={(e) => handleChange({ startTime: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">End: {formatTime(overlay.endTime)}</label>
              <input
                type="range"
                min={overlay.startTime + 0.1}
                max={totalDuration}
                step={0.1}
                value={overlay.endTime}
                onChange={(e) => handleChange({ endTime: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => removeTextOverlay(overlay.id)}
          className="w-full py-2 mt-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
        >
          Remove Text
        </button>
      </div>
    </div>
  );
}
