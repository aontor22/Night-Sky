import { FireworkShape, Velocity } from '../types';

export const random = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getExplosionVelocities = (shape: FireworkShape, count: number, power: number): Velocity[] => {
  const velocities: Velocity[] = [];
  
  switch (shape) {
    case FireworkShape.HEART:
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        // Heart formula with variance
        const variance = random(0.85, 1.15);
        const x = 16 * Math.pow(Math.sin(angle), 3);
        const y = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
        
        velocities.push({
          x: (x / 16) * power * 0.8 * variance,
          y: (y / 16) * power * 0.8 * variance
        });
      }
      break;

    case FireworkShape.STAR:
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        // Star shape parametric approximated with variance
        const variance = random(0.8, 1.25);
        const r = (1 + Math.sin(angle * 5) * 0.5) * variance;
        const vx = Math.cos(angle) * r * power * 0.7;
        const vy = Math.sin(angle) * r * power * 0.7;
        velocities.push({ x: vx, y: vy });
      }
      break;

    case FireworkShape.RING:
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        // Ring with thickness variance
        const speed = power * random(0.9, 1.1);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        velocities.push({ x: vx, y: vy });
      }
      break;

    case FireworkShape.SPIRAL:
      const arms = 3;
      // Distribute particles across arms
      const particlesPerArm = Math.ceil(count / arms);
      for (let arm = 0; arm < arms; arm++) {
        for (let i = 0; i < particlesPerArm; i++) {
          // Normalized position along the arm (0 to 1)
          const t = i / particlesPerArm; 
          
          // Angle logic:
          // Base angle for the arm: (arm * 2PI / 3)
          // Twist: t * PI (half rotation twist along the arm)
          const angle = (arm * (Math.PI * 2) / arms) + (t * Math.PI * 1.5);
          
          // Speed logic:
          // Speed increases with t to ensure the outer particles travel further, creating the spiral
          // Add small randomness to make it look organic
          const speed = power * (0.2 + 0.8 * t) * random(0.9, 1.1);
          
          velocities.push({
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
          });
        }
      }
      break;

    case FireworkShape.CRACKLE:
      for (let i = 0; i < count; i++) {
        // Uniform random distribution in a circle/sphere volume
        // Unlike SPHERE which has streamers, CRACKLE is chaotic static
        const angle = Math.random() * Math.PI * 2;
        // Sqrt for uniform circle distribution or simple random for dense core
        const r = Math.sqrt(Math.random()); 
        const speed = r * power * random(0.8, 1.2); 
        
        velocities.push({
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        });
      }
      break;

    case FireworkShape.SPHERE:
    default:
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        // Non-uniform speed for burst effect
        // Mix of core particles and high-speed streamers
        const baseSpeed = Math.random() * power;
        const burstFactor = Math.random() > 0.7 ? random(1.0, 1.5) : 1.0;
        const speed = baseSpeed * burstFactor;
        
        velocities.push({
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        });
      }
      break;
  }
  
  return velocities;
};

export const getRandomColor = (hue: number) => {
  const lightness = randomInt(50, 75);
  return `hsl(${hue}, 100%, ${lightness}%)`;
};