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
  
  // Flash effect intensity (0.0 to 1.0)
  const flashIntensityRef = useRef<number>(0);

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

    // Scale launch velocity based on screen height
    // Base logic: roughly 1.5% of height per frame is a good fast launch
    const minVel = canvas.height * 0.013;
    const maxVel = canvas.height * 0.017;

    const firework: Firework = {
      x: startX,
      y: startY,
      targetY: destY,
      vx: 0,
      vy: -random(minVel, maxVel), 
      hue: hue,
      exploded: false,
      shape: shape,
      trail: []
    };
    
    fireworksRef.current.push(firework);
    soundManager.playLaunch();
  }, []);

  const explodeFirework = useCallback((firework: Firework) => {
    const particleCount = firework.shape === FireworkShape.SPHERE ? 200 : 120; // Increased count
    
    // Scale power based on screen size (min dimension)
    const canvas = canvasRef.current;
    const minDim = canvas ? Math.min(canvas.width, canvas.height) : 800;
    const scaleFactor = minDim / 1000;
    const power = random(4, 8) * scaleFactor;
    
    const velocities = getExplosionVelocities(firework.shape, particleCount, power);
    const config = configRef.current;
    
    // Trigger Screen Flash
    flashIntensityRef.current = 0.2 + (power / 10) * 0.3; // 0.2 to 0.5 opacity

    velocities.forEach((vel) => {
      const isCrackle = firework.shape === FireworkShape.CRACKLE;
      
      const baseDecay = isCrackle ? random(0.015, 0.03) : random(0.005, 0.015);
      const decay = baseDecay / config.durationMultiplier;

      const baseSize = random(1.5, 3.5);
      const size = Math.max(0.5, baseSize * config.sizeMultiplier);

      const flicker = isCrackle ? true : Math.random() < config.flickerDensity;

      particlesRef.current.push({
        x: firework.x,
        y: firework.y,
        vx: vel.x,
        vy: vel.y,
        alpha: 1,
        hue: firework.hue + randomInt(-20, 20), // Slight hue variation
        decay: decay,
        size: size,
        flicker: flicker
      });
    });

    if (firework.shape === FireworkShape.CRACKLE) {
      soundManager.playCrackle();
      soundManager.playExplosion(0.5);
    } else {
      const intensity = (power - 4) / 5 + 0.5;
      soundManager.playExplosion(intensity);
    }

  }, []);

  // Main Animation Loop
  const loop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // 1. Clear with trails
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Slightly darker trails for cleaner look
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Draw Stars
    const stars = starsRef.current;
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      star.twinklePhase += star.twinkleSpeed;
      const twinkleFactor = Math.sin(star.twinklePhase) * 0.5 + 1; 
      const alpha = Math.min(1, star.baseAlpha * twinkleFactor);

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }

    // 3. Draw Flash Overlay (if active)
    if (flashIntensityRef.current > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensityRef.current})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      flashIntensityRef.current *= 0.85; // Fast decay
    } else {
      flashIntensityRef.current = 0;
    }

    // 4. Update & Draw Fireworks (Rockets)
    ctx.globalCompositeOperation = 'screen';
    for (let i = fireworksRef.current.length - 1; i >= 0; i--) {
      const fw = fireworksRef.current[i];
      
      fw.x += fw.vx;
      fw.y += fw.vy;
      fw.vy += 0.15; 

      // Draw Rocket Head
      ctx.beginPath();
      ctx.arc(fw.x, fw.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${fw.hue}, 100%, 80%)`;
      ctx.fill();

      // Emit trail particles instead of just drawing a line
      if (Math.random() > 0.3) {
        particlesRef.current.push({
            x: fw.x,
            y: fw.y + 5, // Trail slightly behind
            vx: (Math.random() - 0.5) * 0.5,
            vy: 1 + Math.random(), // Falling down
            alpha: 1,
            hue: 40, // Gold/Orange trail
            decay: 0.05,
            size: 1.5,
            flicker: true
        });
      }

      if (fw.vy >= 0 || fw.y <= fw.targetY) {
        explodeFirework(fw);
        fireworksRef.current.splice(i, 1);
      }
    }

    // 5. Update & Draw Particles (Explosion)
    // Use 'lighter' for additive mixing which looks great for light sources
    ctx.globalCompositeOperation = 'lighter'; 
    
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      
      // Realistic Physics
      p.x += p.vx;
      p.y += p.vy;
      
      // Air resistance (Drag): This slows the expansion
      p.vx *= 0.93; 
      p.vy *= 0.93;
      
      // Gravity: Pulls particles down as they slow
      p.vy += 0.06; 
      
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

      // Color Temperature Logic
      // When particles are hot (high alpha), they should be closer to white/bright
      // As they cool (low alpha), they show their true saturated color
      let lightness = 50;
      if (p.alpha > 0.8) {
          lightness = 50 + (p.alpha - 0.8) * 250; // Boost to 100% lightness (white) at start
      }
      
      // Flicker effect
      if (p.flicker && Math.random() > 0.7) {
        lightness += 20;
      }

      ctx.fillStyle = `hsla(${p.hue}, 100%, ${Math.min(100, lightness)}%, ${p.alpha})`;
      
      // Add a slight glow ring
      ctx.shadowBlur = 4;
      ctx.shadowColor = `hsla(${p.hue}, 100%, 50%, ${p.alpha})`;
      
      ctx.fill();
      ctx.shadowBlur = 0; // Reset
    }

    // 6. Auto Launch Scheduler
    if (isRunning) {
      const now = timestamp;
      if (now - lastLaunchRef.current > autoLaunchInterval) {
        createFirework();
        lastLaunchRef.current = now;
      }
      
      if (Math.floor(now) % 10 === 0) {
         const timeUntil = Math.max(0, Math.ceil((autoLaunchInterval - (now - lastLaunchRef.current)) / 1000));
         setNextLaunchIn(timeUntil);
      }
    }

    animationRef.current = requestAnimationFrame(loop);
  }, [isRunning, autoLaunchInterval, createFirework, explodeFirework]);

  // Handle Resize & Init Stars
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvasRef.current.width = w;
        canvasRef.current.height = h;
        generateStars(w, h);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [generateStars]);

  // Start Loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [loop]);

  // Manual Trigger Handler
  const handleManualTrigger = () => {
    soundManager.resume();
    createFirework();
    lastLaunchRef.current = performance.now();
  };

  const handleCanvasClick = () => {
    soundManager.resume();
  };

  return (
    <div className="relative w-full h-full bg-black touch-none" onClick={handleCanvasClick}>
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* UI Overlay */}
      <div className="absolute top-6 left-6 pointer-events-none">
        <h1 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 tracking-tighter drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
          NIGHT SKY
        </h1>
        <p className="text-gray-400 text-xs md:text-sm mt-1 font-mono">
          Next burst in: <span className="text-white font-bold">{nextLaunchIn}s</span>
        </p>
      </div>

      <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleManualTrigger();
          }}
          className="group relative px-6 py-2 md:px-8 md:py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-white font-medium hover:bg-white/10 transition-all hover:scale-105 active:scale-95 overflow-hidden text-sm md:text-base"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            Launch Now
          </span>
        </button>
      </div>
    </div>
  );
};

export default FireworksDisplay;