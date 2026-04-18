import { JOYSTICK_DEAD_ZONE } from './constants';

export interface JoystickState {
  active: boolean;
  dx: number;       // unit vector X
  dy: number;       // unit vector Y
  magnitude: number; // 0..1
  originX: number;
  originY: number;
}

export class InputManager {
  private readonly state: JoystickState = {
    active: false, dx: 0, dy: 0, magnitude: 0, originX: 0, originY: 0,
  };
  private pointerId: number | null = null;

  constructor(canvas: HTMLElement) {
    canvas.addEventListener('pointerdown',   this.onDown,   { passive: false });
    canvas.addEventListener('pointermove',   this.onMove,   { passive: false });
    canvas.addEventListener('pointerup',     this.onUp,     { passive: false });
    canvas.addEventListener('pointercancel', this.onUp,     { passive: false });
  }

  private readonly onDown = (e: PointerEvent): void => {
    e.preventDefault();
    if (this.pointerId !== null) return;
    this.pointerId = e.pointerId;
    this.state.active = true;
    this.state.originX = e.clientX;
    this.state.originY = e.clientY;
    this.state.dx = 0;
    this.state.dy = 0;
    this.state.magnitude = 0;
  };

  private readonly onMove = (e: PointerEvent): void => {
    e.preventDefault();
    if (e.pointerId !== this.pointerId) return;

    const rawDx = e.clientX - this.state.originX;
    const rawDy = e.clientY - this.state.originY;
    const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

    if (dist < JOYSTICK_DEAD_ZONE) {
      this.state.dx = 0;
      this.state.dy = 0;
      this.state.magnitude = 0;
      return;
    }

    this.state.magnitude = 1;  // full speed immediately past dead zone
    this.state.dx = rawDx / dist;
    this.state.dy = rawDy / dist;
  };

  private readonly onUp = (e: PointerEvent): void => {
    e.preventDefault();
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.state.active = false;
    this.state.dx = 0;
    this.state.dy = 0;
    this.state.magnitude = 0;
  };

  get joystick(): Readonly<JoystickState> { return this.state; }

  reset(): void {
    this.pointerId = null;
    this.state.active = false;
    this.state.dx = 0;
    this.state.dy = 0;
    this.state.magnitude = 0;
  }

  drawJoystick(ctx: CanvasRenderingContext2D, outerRadius: number): void {
    if (!this.state.active) return;
    const { originX, originY, dx, dy, magnitude } = this.state;
    const knobX = originX + dx * magnitude * outerRadius;
    const knobY = originY + dy * magnitude * outerRadius;

    ctx.save();
    ctx.beginPath();
    ctx.arc(originX, originY, outerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(knobX, knobY, outerRadius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();
    ctx.restore();
  }
}
