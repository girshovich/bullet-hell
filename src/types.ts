export interface Vec2 {
  x: number;
  y: number;
}

/** Every game object that can be drawn has a sprite field.
 *  Swapping emoji → PNG later is a one-function change in renderer.ts. */
export interface Entity {
  x: number;
  y: number;
  sprite: string;
  size: number;
}

export interface Weapon {
  damage: number;
  fireRate: number;        // shots per second
  projectileCount: number;
  range: number;           // targeting range in px
  pierce: number;          // enemies a shot passes through before dying
}
