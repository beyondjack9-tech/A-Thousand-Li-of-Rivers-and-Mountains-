export interface Point {
  x: number;
  y: number;
}

export interface MountainLayerConfig {
  color: string;
  strokeColor: string;
  fillGradientStart: string;
  fillGradientEnd: string;
  yOffset: number; // Base vertical position (0-1 relative to height)
  amplitude: number; // Height of waves
  frequency: number; // How many peaks
  speed: number; // Parallax speed factor
  opacity: number;
  noise: number; // Roughness
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}
