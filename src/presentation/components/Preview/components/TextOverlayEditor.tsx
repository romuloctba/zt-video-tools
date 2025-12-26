import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/application/store/editorStore';
import type { TextOverlay } from '@/domain/entities/TextOverlay';
import { formatTime } from '@/shared/utils/time';

const FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Playfair Display',
  'Montserrat',
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Impact',
];

/**
 * TextOverlayEditor - UI for editing text overlay properties
 */
export function TextOverlayEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectedId = useEditorStore((s) => s.selectedTextOverlayId);
  const overlay = useEditorStore((s) => 
    selectedId ? s.textOverlays.get(selectedId) : null
  );
  const customFonts = useEditorStore((s) => s.customFonts);
  const addCustomFont = useEditorStore((s) => s.addCustomFont);
  const updateTextOverlay = useEditorStore((s) => s.updateTextOverlay);
  const removeTextOverlay = useEditorStore((s) => s.removeTextOverlay);
  const selectTextOverlay = useEditorStore((s) => s.selectTextOverlay);
  const totalDuration = useEditorStore((s) => s.getTotalDuration());

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking the editor itself or the preview interaction layer
      if (
        editorRef.current && 
        !editorRef.current.contains(target) && 
        !target.closest('.preview-interaction-layer')
      ) {
        selectTextOverlay(null);
      }
    };

    if (selectedId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedId, selectTextOverlay]);

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fontName = file.name.split('.')[0];
      const arrayBuffer = await file.arrayBuffer();
      const fontFace = new FontFace(fontName, arrayBuffer);
      
      await fontFace.load();
      document.fonts.add(fontFace);
      
      addCustomFont(fontName);
      handleChange({ fontFamily: fontName });
    } catch (err) {
      console.error('Failed to load font:', err);
      alert('Failed to load font file');
    }
  };

  if (!overlay) return null;

  const handleChange = (updates: Partial<TextOverlay>) => {
    if (selectedId) {
      updateTextOverlay(selectedId, updates);
    }
  };

  return (
    <div 
      ref={editorRef}
      className="absolute top-4 right-4 w-64 bg-zinc-800/90 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-zinc-700 z-10"
    >
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

        {/* Font Family */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-zinc-400">Font Family</label>
            <label className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer">
              Upload Font
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleFontUpload}
                className="hidden"
              />
            </label>
          </div>
          <select
            value={overlay.fontFamily}
            onChange={(e) => handleChange({ fontFamily: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <optgroup label="System Fonts">
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </optgroup>
            {customFonts.length > 0 && (
              <optgroup label="Custom Fonts">
                {customFonts.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Font Style & Weight */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleChange({ fontWeight: overlay.fontWeight === 'bold' ? 'normal' : 'bold' })}
            className={`flex-1 py-1 rounded border text-sm font-bold transition-colors ${
              overlay.fontWeight === 'bold'
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            B
          </button>
          <button
            onClick={() => handleChange({ fontStyle: overlay.fontStyle === 'italic' ? 'normal' : 'italic' })}
            className={`flex-1 py-1 rounded border text-sm italic transition-colors ${
              overlay.fontStyle === 'italic'
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            I
          </button>
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
