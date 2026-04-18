# Bullet Heaven

Touch-controlled roguelite survival shooter for iPad Safari. Drag to move, auto-shoot enemies, collect XP, level up.

## Running

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # static output in dist/
npm run preview  # preview the build locally
```

## Tuning knobs

All gameplay constants live in **`src/constants.ts`**.

| Constant | Default | Effect |
|---|---|---|
| `PLAYER_SPEED` | 300 | px/sec at full joystick deflection |
| `PLAYER_SIZE` | 48 | Emoji render size in logical px |
| `JOYSTICK_DEAD_ZONE` | 10 | px — tiny wobble below this is ignored |
| `JOYSTICK_MAX_DIST` | 80 | px — finger distance that gives 100% speed |
| `JOYSTICK_VISUAL_RADIUS` | 60 | px — radius of the on-screen joystick ring |
| `FIXED_STEP` | 1/60 | Logic tick rate in seconds |

## Emoji palette

Also in `src/constants.ts` under `EMOJI`. Change any value there to swap a sprite game-wide.

## Phases

- **Phase 1** ✅ Movement prototype — virtual joystick, DPR-correct canvas
- **Phase 2** — Auto-aim shooting, chaser enemies, HP
- **Phase 3** — XP, level-up screen, all 4 enemy types, death summary
- **Phase 4** — Coins, permanent upgrade shop, localStorage save
- **Phase 5** — Juice: screen shake, hit flash, damage numbers, particles, XP magnet

## iPad notes

- Open in Safari landscape for the best experience.
- "Add to Home Screen" enables fullscreen + landscape lock.
- The rotate overlay appears automatically when in portrait on a small screen.
