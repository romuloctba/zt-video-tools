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
 * Now refactored as a full-width section for better mobile and desktop UX.
 */
export function TextOverlayEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Focus input on mount or when selection changes
  useEffect(() => {
    if (overlay && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [selectedId, !!overlay]);

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
      className="h-full w-full bg-zinc-900 p-4 overflow-y-auto border-t border-zinc-800"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white">Text Properties</h3>
          </div>
          <button
            onClick={() => selectTextOverlay(null)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-md transition-colors text-sm"
          >
            <span>Done</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Content & Typography */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Text Content</label>
              <input
                ref={inputRef}
                type="text"
                value={overlay.text}
                onChange={(e) => handleChange({ text: e.target.value })}
                placeholder="Enter text..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Font Family</label>
                <label className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer uppercase tracking-tight">
                  + Upload Custom
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
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

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Size</label>
                <input
                  type="number"
                  value={overlay.fontSize}
                  onChange={(e) => handleChange({ fontSize: parseInt(e.target.value) || 12 })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="w-16">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Color</label>
                <input
                  type="color"
                  value={overlay.color}
                  onChange={(e) => handleChange({ color: e.target.value })}
                  className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer p-1"
                />
              </div>
            </div>
          </div>

          {/* Column 2: Style & Position */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Text Style</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleChange({ fontWeight: overlay.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${
                    overlay.fontWeight === 'bold'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  Bold
                </button>
                <button
                  onClick={() => handleChange({ fontStyle: overlay.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  className={`flex-1 py-2 rounded-lg border text-sm italic transition-all ${
                    overlay.fontStyle === 'italic'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  Italic
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Position</label>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-zinc-500">Horizontal</span>
                    <span className="text-[10px] text-zinc-400">{Math.round(overlay.x * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={overlay.x}
                    onChange={(e) => handleChange({ x: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-zinc-500">Vertical</span>
                    <span className="text-[10px] text-zinc-400">{Math.round(overlay.y * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={overlay.y}
                    onChange={(e) => handleChange({ y: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Timing & Actions */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Timing</label>
                <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-400 font-mono">
                  {(overlay.endTime - overlay.startTime).toFixed(1)}s
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-zinc-500">Start Time</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{formatTime(overlay.startTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={overlay.endTime - 0.1}
                    step={0.1}
                    value={overlay.startTime}
                    onChange={(e) => handleChange({ startTime: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-zinc-500">End Time</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{formatTime(overlay.endTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={overlay.startTime + 0.1}
                    max={totalDuration}
                    step={0.1}
                    value={overlay.endTime}
                    onChange={(e) => handleChange({ endTime: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this text?')) {
                    removeTextOverlay(selectedId!);
                    selectTextOverlay(null);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/20 transition-all text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Text
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
