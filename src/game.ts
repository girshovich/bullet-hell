import { Player } from './player';
import { Enemy, EnemyType } from './enemy';
import { Projectile } from './projectile';
import { XpGem } from './xpgem';
import { Coin } from './coin';
import { EnemySpawner } from './spawner';
import { InputManager } from './input';
import { circlesOverlap } from './collision';
import { drawHUD } from './hud';
import { pickThreeUpgrades, UpgradeOption } from './upgrades';
import { SaveManager, SaveData, PERK_DEFS, LeaderboardEntry } from './save';
import { FIXED_STEP, EMOJI, JOYSTICK_VISUAL_RADIUS } from './constants';

type GameState = 'playing' | 'levelup' | 'dead';

interface CardRect { x: number; y: number; w: number; h: number; }

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly input: InputManager;

  private player!: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private enemyProjectiles: Projectile[] = [];
  private xpGems: XpGem[] = [];
  private coins: Coin[] = [];
  private spawner!: EnemySpawner;

  private logicalW = 0;
  private logicalH = 0;
  private lastTime = 0;
  private accumulator = 0;
  private rafId = 0;

  private gameState: GameState = 'playing';
  private killCount = 0;
  private runTime = 0;
  private runCoins = 0;

  // Level-up state
  private pendingUpgrades: UpgradeOption[] = [];
  private levelUpCards: CardRect[] = [];

  // Shop / leaderboard state (shown on death screen)
  private currentSave: SaveData = SaveManager.load();
  private shopCardRects: CardRect[] = [];
  private newRunButtonRect: CardRect = { x: 0, y: 0, w: 0, h: 0 };
  private eraseButtonRect: CardRect = { x: 0, y: 0, w: 0, h: 0 };
  private eraseSaveConfirm = false;
  private eraseSaveConfirmAt = 0;
  private lastRunScore = 0;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.input = new InputManager(this.canvas);
    this.resize();
    this.initRun();

    window.addEventListener('resize', () => {
      this.resize();
      const half = this.player.size / 2;
      this.player.x = Math.min(this.player.x, this.logicalW - half);
      this.player.y = Math.min(this.player.y, this.logicalH - half);
      if (this.gameState === 'dead') this.computeShopLayout();
    });

    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      if (this.gameState === 'dead') {
        this.handleShopTap(e.clientX, e.clientY);
      } else if (this.gameState === 'levelup') {
        this.handleLevelUpTap(e.clientX, e.clientY);
      }
    });
  }

  private initRun(): void {
    this.currentSave = SaveManager.load();
    this.player = new Player(this.logicalW / 2, this.logicalH / 2);
    this.applyPerks();
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.xpGems = [];
    this.coins = [];
    this.spawner = new EnemySpawner();
    this.killCount = 0;
    this.runCoins = 0;
    this.runTime = 0;
    this.gameState = 'playing';
  }

  private applyPerks(): void {
    const p = this.player;
    const perks = this.currentSave.perks;

    const dmgLv = perks['perm_damage'] ?? 0;
    if (dmgLv > 0) p.weapon = { ...p.weapon, damage: p.weapon.damage * (1 + dmgLv * 0.08) };

    const hpLv = perks['perm_hp'] ?? 0;
    if (hpLv > 0) { p.maxHp += hpLv * 2; p.hp = p.maxHp; }

    const spLv = perks['perm_speed'] ?? 0;
    if (spLv > 0) p.speedMult *= (1 + spLv * 0.06);

    const frLv = perks['perm_fire_rate'] ?? 0;
    if (frLv > 0) p.weapon = { ...p.weapon, fireRate: p.weapon.fireRate * (1 + frLv * 0.08) };

    const pickLv = perks['perm_pickup'] ?? 0;
    if (pickLv > 0) p.pickupRadiusBonus = pickLv * 15;
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.logicalW = window.innerWidth;
    this.logicalH = window.innerHeight;
    this.canvas.width  = this.logicalW * dpr;
    this.canvas.height = this.logicalH * dpr;
    this.canvas.style.width  = `${this.logicalW}px`;
    this.canvas.style.height = `${this.logicalH}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start(): void {
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
  }

  private readonly loop = (now: number): void => {
    const elapsed = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.accumulator += elapsed;

    while (this.accumulator >= FIXED_STEP) {
      if (this.gameState === 'playing') this.update(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
    }

    this.draw();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.runTime += dt;

    this.player.update(dt, this.input.joystick, this.logicalW, this.logicalH);

    if (this.player.fireCooldown <= 0) this.tryFire();

    const spawned = this.spawner.update(dt, this.logicalW, this.logicalH);
    this.enemies.push(...spawned);

    for (const enemy of this.enemies) {
      enemy.update(dt, this.player.x, this.player.y);
    }

    for (const enemy of this.enemies) {
      if (enemy.pendingShots.length === 0) continue;
      for (const shot of enemy.pendingShots) {
        this.enemyProjectiles.push(
          new Projectile(shot.x, shot.y, shot.angle, shot.damage, shot.range, 1, shot.speed, EMOJI.enemyProjectile),
        );
      }
      enemy.pendingShots = [];
    }

    for (const proj of this.projectiles)      proj.update(dt);
    for (const proj of this.enemyProjectiles) proj.update(dt);

    this.checkCollisions();
    this.collectPickups();
    this.purge();

    if (this.player.isDead) this.onRunEnd();
  }

  private tryFire(): void {
    const { weapon, x, y } = this.player;
    let nearest: Enemy | null = null;
    let nearestDist = weapon.range;

    for (const enemy of this.enemies) {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) { nearestDist = dist; nearest = enemy; }
    }

    if (!nearest) return;

    const angle = Math.atan2(nearest.y - y, nearest.x - x);
    const count = weapon.projectileCount;
    const spread = 0.18;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spread;
      this.projectiles.push(
        new Projectile(x, y, angle + offset, weapon.damage, weapon.range, weapon.pierce),
      );
    }
    this.player.fireCooldown = 1 / weapon.fireRate;
  }

  private checkCollisions(): void {
    for (const proj of this.projectiles) {
      if (proj.dead) continue;
      for (const enemy of this.enemies) {
        if (enemy.dead || proj.hitEnemies.has(enemy)) continue;
        if (circlesOverlap(proj.x, proj.y, proj.radius, enemy.x, enemy.y, enemy.radius)) {
          proj.hitEnemies.add(enemy);
          enemy.takeDamage(proj.damage);
          if (enemy.dead) {
            this.killCount++;
            this.xpGems.push(new XpGem(enemy.x, enemy.y, enemy.xpValue));
            this.spawnCoins(enemy.type, enemy.x, enemy.y);
          }
          proj.pierceLeft--;
          if (proj.pierceLeft <= 0) { proj.dead = true; break; }
        }
      }
    }

    for (const proj of this.enemyProjectiles) {
      if (proj.dead) continue;
      if (circlesOverlap(proj.x, proj.y, proj.radius, this.player.x, this.player.y, this.player.radius)) {
        this.player.takeDamage(proj.damage);
        proj.dead = true;
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      if (circlesOverlap(this.player.x, this.player.y, this.player.radius, enemy.x, enemy.y, enemy.radius)) {
        this.player.takeDamage(enemy.damage);
      }
    }
  }

  private spawnCoins(type: EnemyType, x: number, y: number): void {
    let amount = 0;
    switch (type) {
      case 'chaser':  amount = Math.random() < 0.15 ? 1 : 0; break;
      case 'tank':    amount = 2; break;
      case 'shooter': amount = Math.random() < 0.70 ? 1 : 0; break;
      case 'swarmer': amount = 0; break;
    }
    for (let i = 0; i < amount; i++) {
      const jx = x + (Math.random() - 0.5) * 24;
      const jy = y + (Math.random() - 0.5) * 24;
      this.coins.push(new Coin(jx, jy));
    }
  }

  private collectPickups(): void {
    const pr = this.player.pickupRadius;
    for (const gem of this.xpGems) {
      if (gem.dead) continue;
      const dx = this.player.x - gem.x;
      const dy = this.player.y - gem.y;
      if (dx * dx + dy * dy < (pr + gem.radius) ** 2) {
        gem.dead = true;
        if (this.player.addXp(gem.value) && this.gameState === 'playing') {
          this.enterLevelUp();
        }
      }
    }

    for (const coin of this.coins) {
      if (coin.dead) continue;
      const dx = this.player.x - coin.x;
      const dy = this.player.y - coin.y;
      if (dx * dx + dy * dy < (pr + coin.radius) ** 2) {
        coin.dead = true;
        this.runCoins++;
      }
    }
  }

  private onRunEnd(): void {
    this.gameState = 'dead';
    this.currentSave.coins += this.runCoins;

    const score = this.killCount * 10 + Math.floor(this.runTime);
    this.lastRunScore = score;

    if (score > 0) {
      const lb = this.currentSave.leaderboard;
      const qualifies = lb.length < 10 || score > lb[lb.length - 1].score;
      if (qualifies) {
        let name = 'Anonymous';
        try {
          name = (prompt('🏆 Top-10 score! Enter your name:') ?? '').trim().slice(0, 18) || 'Anonymous';
        } catch { /* prompt blocked */ }
        const entry: LeaderboardEntry = { name, score, kills: this.killCount, time: Math.floor(this.runTime) };
        lb.push(entry);
        lb.sort((a, b) => b.score - a.score);
        this.currentSave.leaderboard = lb.slice(0, 10);
      }
    }

    SaveManager.save(this.currentSave);
    this.computeShopLayout();
    this.eraseSaveConfirm = false;
  }

  private enterLevelUp(): void {
    this.pendingUpgrades = pickThreeUpgrades();
    this.levelUpCards = this.computeLevelUpCards();
    this.gameState = 'levelup';
  }

  private computeLevelUpCards(): CardRect[] {
    const cardW = 165, cardH = 165, gap = 22;
    const totalW = 3 * cardW + 2 * gap;
    const startX = (this.logicalW - totalW) / 2;
    const startY = (this.logicalH - cardH) / 2;
    return [0, 1, 2].map(i => ({ x: startX + i * (cardW + gap), y: startY, w: cardW, h: cardH }));
  }

  private computeShopLayout(): void {
    const w = this.logicalW, h = this.logicalH;

    // Right column: shop (starts at x = 42% of width)
    const shopX = w * 0.42;
    const shopW = w - shopX - 20;

    const n = PERK_DEFS.length;
    const gap = 8;
    const cardW = Math.floor((shopW - (n - 1) * gap) / n);
    const cardH = 115;
    const cardsY = h * 0.38;
    this.shopCardRects = PERK_DEFS.map((_, i) => ({
      x: shopX + i * (cardW + gap), y: cardsY, w: cardW, h: cardH,
    }));

    const btnW = Math.min(200, shopW * 0.6);
    const btnH = 46;
    this.newRunButtonRect = { x: shopX + (shopW - btnW) / 2, y: h * 0.70, w: btnW, h: btnH };

    const ew = 140, eh = 28;
    this.eraseButtonRect = { x: shopX + (shopW - ew) / 2, y: h * 0.84, w: ew, h: eh };
  }

  private handleLevelUpTap(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const lx = clientX - rect.left;
    const ly = clientY - rect.top;
    for (let i = 0; i < this.levelUpCards.length; i++) {
      const c = this.levelUpCards[i];
      if (lx >= c.x && lx <= c.x + c.w && ly >= c.y && ly <= c.y + c.h) {
        this.pendingUpgrades[i].apply(this.player);
        this.input.reset();
        this.gameState = 'playing';
        return;
      }
    }
  }

  private handleShopTap(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const lx = clientX - rect.left;
    const ly = clientY - rect.top;

    const inRect = (r: CardRect) => lx >= r.x && lx <= r.x + r.w && ly >= r.y && ly <= r.y + r.h;

    // New Run button
    if (inRect(this.newRunButtonRect)) {
      this.input.reset();
      this.initRun();
      return;
    }

    // Erase save button
    if (inRect(this.eraseButtonRect)) {
      const now = performance.now();
      if (this.eraseSaveConfirm && now - this.eraseSaveConfirmAt < 3000) {
        SaveManager.reset();
        this.currentSave = SaveManager.load();
        this.eraseSaveConfirm = false;
      } else {
        this.eraseSaveConfirm = true;
        this.eraseSaveConfirmAt = now;
      }
      return;
    }

    // Perk cards — buy upgrade
    for (let i = 0; i < this.shopCardRects.length; i++) {
      if (!inRect(this.shopCardRects[i])) continue;
      const def = PERK_DEFS[i];
      const currentLv = this.currentSave.perks[def.id] ?? 0;
      if (currentLv >= def.maxLevel) return;
      const cost = def.costs[currentLv];
      if (this.currentSave.coins < cost) return;
      this.currentSave.coins -= cost;
      this.currentSave.perks[def.id] = currentLv + 1;
      SaveManager.save(this.currentSave);
      return;
    }
  }

  private purge(): void {
    this.enemies          = this.enemies.filter(e => !e.dead);
    this.projectiles      = this.projectiles.filter(p => !p.dead);
    this.enemyProjectiles = this.enemyProjectiles.filter(p => !p.dead);
    this.xpGems           = this.xpGems.filter(g => !g.dead);
    this.coins            = this.coins.filter(c => !c.dead);
  }

  // ─── Drawing ──────────────────────────────────────────────────────────────

  private draw(): void {
    const { ctx, logicalW: w, logicalH: h } = this;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const grid = 80;
    for (let x = 0; x <= w; x += grid) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += grid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    for (const coin  of this.coins)            coin.draw(ctx);
    for (const gem   of this.xpGems)           gem.draw(ctx);
    for (const enemy of this.enemies)          enemy.draw(ctx);
    for (const proj  of this.projectiles)      proj.draw(ctx);
    for (const proj  of this.enemyProjectiles) proj.draw(ctx);
    this.player.draw(ctx);

    this.input.drawJoystick(ctx, JOYSTICK_VISUAL_RADIUS);
    drawHUD(ctx, this.player, this.killCount, this.runTime, this.runCoins);

    if (this.gameState === 'dead')    this.drawShopOverlay();
    if (this.gameState === 'levelup') this.drawLevelUpOverlay();
  }

  private drawLevelUpOverlay(): void {
    const { ctx, logicalW: w, logicalH: h } = this;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillStyle = '#ffdd44';
    ctx.fillText(`⭐  LEVEL ${this.player.level}  ⭐`, w / 2, h / 2 - 120);

    for (let i = 0; i < this.levelUpCards.length; i++) {
      const card = this.levelUpCards[i];
      const upgrade = this.pendingUpgrades[i];
      const cx = card.x + card.w / 2;
      const cy = card.y + card.h / 2;

      ctx.fillStyle = 'rgba(20, 20, 50, 0.95)';
      ctx.fillRect(card.x, card.y, card.w, card.h);
      ctx.strokeStyle = '#7744ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(card.x, card.y, card.w, card.h);

      ctx.font = `38px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(upgrade.emoji, cx, cy - 34);

      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(upgrade.label, cx, cy + 10);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(upgrade.description, cx, cy + 34);
    }

    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Tap a card to choose', w / 2, h / 2 + 120);
  }

  private drawShopOverlay(): void {
    const { ctx, logicalW: w, logicalH: h } = this;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.90)';
    ctx.fillRect(0, 0, w, h);

    const divX = w * 0.40;

    // ── LEFT COLUMN: leaderboard ──────────────────────────────────────────
    const lbX = 24;
    const lbW = divX - 32;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#ffcc44';
    ctx.fillText('🏆  TOP SCORES', lbX, h * 0.08);

    const lb = this.currentSave.leaderboard;
    const rowH = Math.min(32, (h * 0.80) / 10);
    const startY = h * 0.16;

    if (lb.length === 0) {
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#555577';
      ctx.fillText('No scores yet', lbX + 8, startY + rowH);
    }

    for (let i = 0; i < lb.length; i++) {
      const entry = lb[i];
      const ry = startY + i * rowH;
      const isNew = entry.score === this.lastRunScore && i === lb.findIndex(e => e.score === this.lastRunScore);

      if (isNew) {
        ctx.fillStyle = 'rgba(255, 220, 50, 0.12)';
        ctx.fillRect(lbX - 4, ry - rowH * 0.45, lbW, rowH * 0.9);
      }

      ctx.font = `bold 12px sans-serif`;
      ctx.fillStyle = isNew ? '#ffdd44' : i === 0 ? '#ffaa22' : '#aaaacc';
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}.`, lbX, ry);

      ctx.fillStyle = isNew ? '#ffffff' : '#cccccc';
      ctx.font = '12px sans-serif';
      ctx.fillText(entry.name, lbX + 24, ry);

      const mins = Math.floor(entry.time / 60).toString().padStart(2, '0');
      const secs = (entry.time % 60).toString().padStart(2, '0');
      ctx.textAlign = 'right';
      ctx.fillStyle = isNew ? '#ffdd44' : '#9999bb';
      ctx.fillText(`${entry.kills}💀  ${mins}:${secs}`, lbX + lbW, ry);
    }

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(divX, h * 0.05);
    ctx.lineTo(divX, h * 0.95);
    ctx.stroke();

    // ── RIGHT COLUMN: stats + shop ────────────────────────────────────────
    const shopX = divX + 20;
    const shopW = w - shopX - 20;
    const scx = shopX + shopW / 2;

    ctx.textAlign = 'center';

    // Death header
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#ff4444';
    ctx.fillText('💀 YOU DIED', scx, h * 0.08);

    const mins = Math.floor(this.runTime / 60).toString().padStart(2, '0');
    const secs = Math.floor(this.runTime % 60).toString().padStart(2, '0');
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText(`${mins}:${secs}  ·  ${this.killCount} kills  ·  Lv.${this.player.level}`, scx, h * 0.17);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#ffcc44';
    ctx.fillText(`+${this.runCoins} 🪙  ·  Total: ${this.currentSave.coins} 🪙`, scx, h * 0.24);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#7755cc';
    ctx.fillText('── PERMANENT UPGRADES ──', scx, h * 0.32);

    // Perk cards
    for (let i = 0; i < this.shopCardRects.length; i++) {
      const card = this.shopCardRects[i];
      const def  = PERK_DEFS[i];
      const lv   = this.currentSave.perks[def.id] ?? 0;
      const maxed = lv >= def.maxLevel;
      const cost  = maxed ? 0 : def.costs[lv];
      const canAfford = this.currentSave.coins >= cost;
      const cardCx = card.x + card.w / 2;
      const cardCy = card.y + card.h / 2;

      ctx.fillStyle = maxed ? 'rgba(20,50,20,0.9)' : canAfford ? 'rgba(20,20,50,0.95)' : 'rgba(35,20,20,0.85)';
      ctx.fillRect(card.x, card.y, card.w, card.h);
      ctx.strokeStyle = maxed ? '#44aa44' : canAfford ? '#7744ff' : '#553333';
      ctx.lineWidth = 2;
      ctx.strokeRect(card.x, card.y, card.w, card.h);

      ctx.font = `22px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(def.emoji, cardCx, cardCy - 32);

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(def.label, cardCx, cardCy - 12);

      // Current total effect
      const effect = def.totalEffect(lv);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#88ffaa';
      ctx.fillText(effect || def.descPerLevel, cardCx, cardCy + 6);

      // Stars
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#ffdd44';
      ctx.fillText('★'.repeat(lv) + '☆'.repeat(def.maxLevel - lv), cardCx, cardCy + 24);

      // Cost or maxed
      if (maxed) {
        ctx.fillStyle = '#44cc44';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('MAXED', cardCx, cardCy + 42);
      } else {
        ctx.fillStyle = canAfford ? '#ffcc44' : '#aa6666';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${cost} 🪙`, cardCx, cardCy + 42);
      }
    }

    // New Run button
    const btn = this.newRunButtonRect;
    ctx.fillStyle = '#1a4a1a';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = '#44dd44';
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶  NEW RUN', btn.x + btn.w / 2, btn.y + btn.h / 2);

    // Erase save button
    const erasing = this.eraseSaveConfirm && performance.now() - this.eraseSaveConfirmAt < 3000;
    const er = this.eraseButtonRect;
    ctx.fillStyle = erasing ? 'rgba(140,20,20,0.9)' : 'rgba(50,18,18,0.7)';
    ctx.fillRect(er.x, er.y, er.w, er.h);
    ctx.strokeStyle = erasing ? '#ff4444' : '#553333';
    ctx.lineWidth = 1;
    ctx.strokeRect(er.x, er.y, er.w, er.h);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = erasing ? '#ff8888' : '#775555';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(erasing ? '⚠ Tap again to confirm' : 'Erase Save Data', er.x + er.w / 2, er.y + er.h / 2);
  }
}
