import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Firework, Particle, FireworkShape, ParticleConfig, Star } from '../types';
import { random, randomInt, getExplosionVelocities, getRandomColor } from '../utils/math';
import { soundManager } from '../utils/sound';

interface FireworksDisplayProps {
  autoLaunchInterval?: number; // ms
  isRunning: boolean;
  particleConfig: ParticleConfig;
}

const FireworksDisplay: React.FC<FireworksDisplayProps> = ({ 
  autoLaunchInterval = 4000,
  isRunning,
  particleConfig
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastLaunchRef = useRef<number>(0);
  
  // Use a ref for config to avoid re-creating the animation loop on every slider change
  const configRef = useRef(particleConfig);

  useEffect(() => {
    configRef.current = particleConfig;
  }, [particleConfig]);

  // State to hold physics objects. 
  // We use refs for these to avoid re-renders on every frame (60fps)
  const fireworksRef = useRef<Firework[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  
  // For the React UI to display
  const [nextLaunchIn, setNextLaunchIn] = useState<number>(4);

  // Initialize Sound Manager
  useEffect(() => {
    soundManager.init();
  }, []);

  // Generate Stars
  const generateStars = useCallback((width: number, height: number) => {
    // Density: roughly 1 star per 8000 pixels squared
    const count = Math.floor((width * height) / 8000); 
    const stars: Star[] = [];
    
    for (let i = 0; i < count; i++) {
      stars.push({
        x: random(0, width),
        y: random(0, height),
        size: random(0.5, 1.8), // Small size
        baseAlpha: random(0.2, 0.7), // Varied brightness
        twinkleSpeed: random(0.005, 0.03), // Subtle animation speed
        twinklePhase: random(0, Math.PI * 2) // Random start phase
      });
    }
    starsRef.current = stars;
  }, []);

  const createFirework = useCallback((targetX?: number, targetY?: number, overrideShape?: FireworkShape) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const startX = targetX ?? random(canvas.width * 0.2, canvas.width * 0.8);
    const startY = canvas.height;
    const destY = targetY ?? random(canvas.height * 0.1, canvas.height * 0.4);
    
    // Choose a random shape if not provided
    const shapes = [
      FireworkShape.SPHERE, 
      FireworkShape.RING, 
      FireworkShape.HEART, 
      FireworkShape.STAR, 
      FireworkShape.SPIRAL, 
      FireworkShape.CRACKLE
    ];
    const shape = overrideShape ?? shapes[randomInt(0, shapes.length - 1)];
    
    // Determine Hue
    const config = configRef.current;
    const hue = config.hueMode === 'CUSTOM' ? config.customHue : randomInt(0, 360);

    // Scale launch velocity based on screen height to keep animation timing consistent
    // Base logic: roughly 1.5% of height per frame is a good fast launch
    const minVel = canvas.height * 0.013