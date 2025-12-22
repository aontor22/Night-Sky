export enum FireworkShape {
  SPHERE = 'SPHERE',
  HEART = 'HEART',
  STAR = 'STAR',
  RING = 'RING',
  SPIRAL = 'SPIRAL',
  CRACKLE = 'CRACKLE',
  RANDOM = 'RANDOM'
}

export type HueMode = 'RANDOM' | 'CUSTOM';

export interface ParticleConfig {
  sizeMultiplier: number;
  durationMultiplier: number;
  flickerDensity: number;
  hueMode: HueMode;
  customHue: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  decay: number;
  size: number;
  flicker: boolean;
}

export interface Firework {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  hue: number;
  exploded: boolean;
  shape: FireworkShape;
  trail: Point[];
}