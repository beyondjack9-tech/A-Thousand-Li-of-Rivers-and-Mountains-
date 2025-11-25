import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MountainLayerConfig, Particle, Ripple } from '../types';

// --- Constants & Palette ---
// Colors inspired by "A Thousand Li of Rivers and Mountains"
const PALETTE = {
  bg: '#F4F1E8', // Antique Rice Paper
  stoneBlue: '#2B5F75', // Shi Qing
  stoneGreen: '#4A8F78', // Shi Lu
  darkGreen: '#1A3B32',
  ochre: '#A66E4E', // Zhe Shi
  faintBlue: '#8FAABC',
  gold: '#D4AF37',
  ink: '#1A1A1A',
  sealRed: '#B63B34',
};

// Configuration for mountain layers (Back to Front)
const LAYERS: MountainLayerConfig[] = [
  {
    // Distant background mountains - faint, slow
    color: PALETTE.faintBlue,
    strokeColor: '#6B8C9E',
    fillGradientStart: '#8FAABC',
    fillGradientEnd: '#F4F1E8',
    yOffset: 0.35,
    amplitude: 80,
    frequency: 0.002,
    speed: 0.02,
    opacity: 0.6,
    noise: 10,
  },
  {
    // Mid-ground mountains - dominant Blue
    color: PALETTE.stoneBlue,
    strokeColor: '#1A3B32',
    fillGradientStart: PALETTE.stoneBlue,
    fillGradientEnd: PALETTE.bg,
    yOffset: 0.55,
    amplitude: 120,
    frequency: 0.003,
    speed: 0.05,
    opacity: 0.9,
    noise: 20,
  },
  {
    // Mid-foreground - dominant Green
    color: PALETTE.stoneGreen,
    strokeColor: '#2B4F3F',
    fillGradientStart: PALETTE.stoneGreen,
    fillGradientEnd: PALETTE.bg,
    yOffset: 0.75,
    amplitude: 100,
    frequency: 0.004,
    speed: 0.1,
    opacity: 0.95,
    noise: 15,
  },
  {
    // Foreground - Ochre accents, transparent, wide
    color: PALETTE.ochre,
    strokeColor: '#5C3A28',
    fillGradientStart: 'rgba(166, 110, 78, 0.4)',
    fillGradientEnd: 'rgba(244, 241, 232, 0.1)',
    yOffset: 0.9,
    amplitude: 60,
    frequency: 0.0015,
    speed: 0.2,
    opacity: 0.8,
    noise: 5,
  },
];

const PoeticLandscape: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const frameCountRef = useRef<number>(0);

  // State for interactivity
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const goldDustRef = useRef<Particle[]>([]);
  
  // Initialize Gold Dust (Ambient particles)
  useEffect(() => {
    const dust: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      dust.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 0.5,
        life: 1, // infinite
        maxLife: 1,
        color: PALETTE.gold,
      });
    }
    goldDustRef.current = dust;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // --- Interaction Handlers ---

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    mouseRef.current.targetX = (clientX - window.innerWidth / 2);
    mouseRef.current.targetY = (clientY - window.innerHeight / 2);

    // Brush Trail Logic
    // Only add particles occasionally to avoid clutter
    if (frameCountRef.current % 2 === 0) {
      particlesRef.current.push({
        x: clientX,
        y: clientY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.5, // Slight drop? No, prompt says drying ink, no gravity.
        size: Math.random() * 4 + 2,
        life: 1.0,
        maxLife: 1.0,
        color: Math.random() > 0.5 ? '#111' : '#223', // Ink colors
      });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    ripplesRef.current.push({
      x: clientX,
      y: clientY,
      radius: 0,
      maxRadius: 100 + Math.random() * 50,
      opacity: 0.6,
      color: Math.random() > 0.5 ? PALETTE.stoneGreen : PALETTE.stoneBlue,
    });
  };

  // --- Drawing Logic ---

  const drawRicePaperTexture = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, width, height);

    // Add subtle noise for paper texture
    // Only draw noise once per large area or use a pattern, but for dynamic we draw random dots
    // To save performance, we assume standard background.
    // For effect, we draw faint grain:
    ctx.fillStyle = 'rgba(160, 150, 130, 0.08)';
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const s = Math.random() * 2;
        ctx.fillRect(x, y, s, s);
    }
  };

  const drawMountain = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    layer: MountainLayerConfig,
    time: number,
    parallaxX: number
  ) => {
    const { yOffset, amplitude, frequency, speed, color, strokeColor, fillGradientStart, fillGradientEnd, noise } = layer;
    
    // Parallax calculation
    const currentParallax = parallaxX * speed;
    
    // Breathing effect (vertical shift)
    const breath = Math.sin(time * 0.5) * 5; 

    const baseY = height * yOffset + breath;

    ctx.beginPath();
    ctx.moveTo(0, height); // Start bottom left

    // Draw the wave
    for (let x = 0; x <= width; x += 5) { // Step 5 for performance vs quality
      // Combine multiple sine waves for organic look
      // Main shape
      const y1 = Math.sin((x + currentParallax) * frequency + time * 0.1) * amplitude;
      // Detail shape (higher frequency)
      const y2 = Math.sin((x + currentParallax) * (frequency * 2.5) + time * 0.2) * (amplitude * 0.3);
      // Roughness
      const y3 = Math.cos((x - currentParallax) * (frequency * 5)) * noise;

      ctx.lineTo(x, baseY - (y1 + y2 + y3));
    }

    ctx.lineTo(width, height); // Bottom right
    ctx.closePath();

    // Fill Gradient
    const gradient = ctx.createLinearGradient(0, baseY - amplitude, 0, height);
    gradient.addColorStop(0, fillGradientStart);
    gradient.addColorStop(1, fillGradientEnd);
    ctx.fillStyle = gradient;
    ctx.globalAlpha = layer.opacity;
    ctx.fill();

    // Stroke (Iron Wire Style - Gongbi)
    // We need to re-trace the top line for the stroke without the bottom closure
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 5) {
      const y1 = Math.sin((x + currentParallax) * frequency + time * 0.1) * amplitude;
      const y2 = Math.sin((x + currentParallax) * (frequency * 2.5) + time * 0.2) * (amplitude * 0.3);
      const y3 = Math.cos((x - currentParallax) * (frequency * 5)) * noise;
      if (x === 0) ctx.moveTo(x, baseY - (y1 + y2 + y3));
      else ctx.lineTo(x, baseY - (y1 + y2 + y3));
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  const animate = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current++;
    const width = canvas.width;
    const height = canvas.height;
    const t = time * 0.001; // Seconds

    // Smooth Mouse LERP for Parallax
    mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
    mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

    // 1. Clear & Background
    ctx.clearRect(0, 0, width, height);
    drawRicePaperTexture(ctx, width, height);

    // 2. Draw Mountains (Back to Front)
    LAYERS.forEach(layer => {
      drawMountain(ctx, width, height, layer, t, mouseRef.current.x);
    });

    // 3. Draw Gold Dust (Atmosphere)
    goldDustRef.current.forEach(p => {
      // Float movement
      p.x += Math.sin(t + p.y * 0.01) * 0.5;
      p.y += Math.cos(t + p.x * 0.01) * 0.2;
      
      // Wrap around
      if (p.x > width) p.x = 0;
      if (p.x < 0) p.x = width;
      if (p.y > height) p.y = 0;
      if (p.y < 0) p.y = height;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      // Twinkle
      ctx.globalAlpha = 0.5 + Math.sin(t * 5 + p.x) * 0.3; 
      ctx.fill();
    });

    // 4. Draw Ripples (Ink expansion)
    for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
      const r = ripplesRef.current[i];
      r.radius += 1.5;
      r.opacity -= 0.01;

      if (r.opacity <= 0) {
        ripplesRef.current.splice(i, 1);
      } else {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2 + (1 - r.opacity) * 10; // Thicken as it fades out (ink spread)
        ctx.globalAlpha = r.opacity;
        ctx.stroke();
        
        // Secondary ring
        if (r.radius > 20) {
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius - 15, 0, Math.PI * 2);
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = r.opacity * 0.5;
            ctx.stroke();
        }
      }
    }

    // 5. Draw Brush Trail (Mouse Ink)
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.life -= 0.02;
      p.size *= 0.98; // Shrink slightly

      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 0.6; // Not too dark
        ctx.fill();
      }
    }

    // Reset Global Alpha
    ctx.globalAlpha = 1.0;

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full cursor-none">
      {/* Canvas Layer */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="block w-full h-full touch-none"
      />

      {/* Typography & Seal Overlay */}
      <div className="absolute top-12 right-12 md:top-20 md:right-24 z-10 pointer-events-none select-none flex flex-row-reverse gap-8 items-start">
        
        {/* Title */}
        <div className="writing-vertical-rl font-['Ma_Shan_Zheng'] text-stone-800 space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold tracking-widest opacity-90 drop-shadow-sm">
            只此青绿
          </h1>
        </div>

        {/* Poem */}
        <div className="writing-vertical-rl font-['Ma_Shan_Zheng'] text-stone-600 pt-16">
          <p className="text-2xl md:text-3xl tracking-wider leading-loose opacity-80">
            心中若有丘壑 眉目便是山河
          </p>
        </div>

        {/* Seal (Stamp) */}
        <div className="absolute -bottom-24 right-2 md:-bottom-32 md:right-4 opacity-90">
            <div className="border-4 border-[#B63B34] bg-[#B63B34] text-[#F4F1E8] p-2 w-16 h-16 md:w-20 md:h-20 flex flex-col justify-center items-center shadow-sm rounded-sm">
                <span className="font-['Ma_Shan_Zheng'] text-lg md:text-xl leading-none text-center grid grid-cols-2 gap-0.5">
                    <span>千</span><span>里</span>
                    <span>江</span><span>山</span>
                </span>
            </div>
        </div>
      </div>

      {/* Custom Cursor Hint (Optional, stylized dot) */}
      <div 
        className="fixed w-3 h-3 bg-stone-800 rounded-full pointer-events-none mix-blend-multiply opacity-50 z-50 transform -translate-x-1/2 -translate-y-1/2"
        style={{
             left: mouseRef.current.targetX + window.innerWidth/2,
             top: mouseRef.current.targetY + window.innerHeight/2
        }} 
      />
      
      {/* Intro Overlay/Instruction */}
      <div className="absolute bottom-8 left-8 text-stone-500 font-['Ma_Shan_Zheng'] text-lg opacity-60 pointer-events-none">
          <p>移动鼠标以观山河 • 点击水面以生涟漪</p>
      </div>
    </div>
  );
};

export default PoeticLandscape;
