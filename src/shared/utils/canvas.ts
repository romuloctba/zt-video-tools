import type { TextOverlay } from '@/domain/entities/TextOverlay';

/**
 * Draws a text overlay onto a canvas context
 */
export function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  overlay: TextOverlay
): void {
  ctx.save();

  // Scale font size relative to canvas height to maintain proportions
  // Assuming 480px as a base height for font scaling
  const responsiveFontSize = (overlay.fontSize * canvasHeight) / 480;

  ctx.fillStyle = overlay.color;
  ctx.font = `${responsiveFontSize}px ${overlay.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const posX = overlay.x * canvasWidth;
  const posY = overlay.y * canvasHeight;

  // Add a subtle shadow for better readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillText(overlay.text, posX, posY);
  ctx.restore();
}
