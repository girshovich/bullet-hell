import { Player } from './player';

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  player: Player,
  killCount: number,
  runTime: number,
  runCoins = 0,
): void {
  const barW = 180;
  const barH = 14;
  const xpBarH = 6;
  const x = 20;
  const y = 20;
  const hpRatio = Math.max(0, player.hp / player.maxHp);

  // HP bar background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(x, y, barW, barH);

  // HP fill
  ctx.fillStyle = hpRatio > 0.5 ? '#55ee55' : hpRatio > 0.25 ? '#ffaa22' : '#ff4444';
  ctx.fillRect(x, y, Math.round(barW * hpRatio), barH);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, barW, barH);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, x + barW + 8, y + barH / 2);

  // XP bar
  const xpY = y + barH + 5;
  const xpRatio = player.xp / player.xpToNextLevel;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(x, xpY, barW, xpBarH);
  ctx.fillStyle = '#8855ff';
  ctx.fillRect(x, xpY, Math.round(barW * xpRatio), xpBarH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, xpY, barW, xpBarH);
  ctx.fillStyle = '#aaaaff';
  ctx.font = '11px sans-serif';
  ctx.fillText(`Lv.${player.level}`, x + barW + 8, xpY + xpBarH / 2);

  // Kill count + coins (top right)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(
    `💀 ${killCount}   🪙 ${runCoins}`,
    ctx.canvas.width / (window.devicePixelRatio || 1) - 20,
    y + barH / 2,
  );

  // Timer (top center)
  const mins = Math.floor(runTime / 60).toString().padStart(2, '0');
  const secs = Math.floor(runTime % 60).toString().padStart(2, '0');
  ctx.textAlign = 'center';
  ctx.fillText(
    `${mins}:${secs}`,
    ctx.canvas.width / (window.devicePixelRatio || 1) / 2,
    y + barH / 2,
  );
}
