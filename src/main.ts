import { Game } from './game';

// Attempt landscape lock — works when launched as a PWA (Add to Home Screen)
// In Safari browser, screen.orientation.lock requires fullscreen which isn't available
async function tryLockLandscape(): Promise<void> {
  try {
    // lock() is present in PWA context but missing from the TS DOM lib types
    const orient = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    await orient.lock?.('landscape');
  } catch {
    // Expected in browser context — handled by CSS overlay in index.html
  }
}

const game = new Game();
game.start();
tryLockLandscape();
