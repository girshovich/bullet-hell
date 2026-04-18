/**
 * Central emoji rendering helper.
 * All entities call this — swapping to a PNG sprite sheet later
 * is a change to this one function.
 */
export function drawEmoji(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  x: number,
  y: number,
  size: number,
  rotation?: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  if (rotation !== undefined) ctx.rotate(rotation);
  // Apple Color Emoji first so iPad Safari uses the color glyphs
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, 0);
  ctx.restore();
}
