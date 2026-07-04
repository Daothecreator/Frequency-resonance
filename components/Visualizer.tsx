'use client';

import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  frequency: number;
}

export default function Visualizer({ isPlaying, frequency }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        width = parent.clientWidth;
        height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      timeRef.current += 0.01;
      const t = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.min(width, height) * 0.4;

      // Base color based on frequency
      // 111Hz -> Deep Red/Purple
      // 396Hz -> Orange/Red
      // 432Hz -> Green/Blue
      // 528Hz -> Gold/Yellow
      let hue = 200; // Default blue
      if (frequency === 111) hue = 280;
      else if (frequency === 396) hue = 15;
      else if (frequency === 432) hue = 160;
      else if (frequency === 528) hue = 45;

      // Breathing effect
      const breathe = isPlaying ? Math.sin(t * 2) * 0.1 + 0.9 : 1.0;
      const radius = maxRadius * breathe;

      // Draw glowing orbs
      for (let i = 0; i < 3; i++) {
        const r = radius * (1 - i * 0.2);
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        
        const alpha = isPlaying ? 0.6 - i * 0.15 : 0.1;
        
        gradient.addColorStop(0, `hsla(${hue}, 80%, 70%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${hue + 20}, 70%, 50%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${hue + 40}, 60%, 30%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw subtle ripples if playing
      if (isPlaying) {
        const numRipples = 5;
        for (let i = 0; i < numRipples; i++) {
          const ripplePhase = (t * 0.5 + i / numRipples) % 1;
          const rippleRadius = maxRadius * 1.5 * ripplePhase;
          const rippleAlpha = (1 - ripplePhase) * 0.3;

          ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${rippleAlpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, rippleRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw central core
      const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.2);
      const coreAlpha = isPlaying ? 0.9 : 0.3;
      coreGradient.addColorStop(0, `hsla(0, 0%, 100%, ${coreAlpha})`);
      coreGradient.addColorStop(1, `hsla(${hue}, 90%, 80%, 0)`);
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, frequency]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full absolute inset-0 pointer-events-none transition-opacity duration-1000"
      style={{ opacity: isPlaying ? 1 : 0.4 }}
    />
  );
}
