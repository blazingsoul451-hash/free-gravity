import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

interface ParticleCanvasProps {
  className?: string;
  particleCount?: number;
  connectionDistance?: number;
  reactRadius?: number;
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  className = '',
  particleCount = 85,
  connectionDistance = 120,
  reactRadius = 160,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    // Mouse velocity physics state
    const mouse = {
      x: -1000,
      y: -1000,
      prevX: -1000,
      prevY: -1000,
      vx: 0,
      vy: 0,
      speed: 0,
      active: false,
    };

    // Scroll tracking
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    const particles: Particle[] = [];
    const colors = [
      'rgba(124, 58, 237, ', // violet #7c3aed
      'rgba(6, 182, 212, ',  // cyan #06b6d4
      'rgba(99, 102, 241, ', // indigo #6366f1
      'rgba(241, 245, 249, ', // slate #f1f5f9
    ];

    const initParticles = () => {
      particles.length = 0;
      const count = Math.floor((width * height) / 12000) || particleCount;
      const actualCount = Math.min(Math.max(count, 45), 110);

      for (let i = 0; i < actualCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.5 + 0.2,
          pulseSpeed: Math.random() * 0.03 + 0.01,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    const handleResize = () => {
      dpr = window.devicePixelRatio || 1;
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      if (mouse.prevX === -1000) {
        mouse.prevX = clientX;
        mouse.prevY = clientY;
      }

      const dx = clientX - mouse.prevX;
      const dy = clientY - mouse.prevY;
      
      // Calculate smoothed velocity
      mouse.vx = dx * 0.6 + mouse.vx * 0.4;
      mouse.vy = dy * 0.6 + mouse.vy * 0.4;
      mouse.speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);

      mouse.prevX = clientX;
      mouse.prevY = clientY;
      mouse.x = clientX;
      mouse.y = clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.vx = 0;
      mouse.vy = 0;
      mouse.speed = 0;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollVelocity = (currentScrollY - lastScrollY) * 0.15;
      lastScrollY = currentScrollY;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Animation Loop
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Dampen mouse velocity
      mouse.vx *= 0.92;
      mouse.vy *= 0.92;
      mouse.speed *= 0.92;
      scrollVelocity *= 0.9;

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Cosmic pulsing
        p.pulsePhase += p.pulseSpeed;
        const currentAlpha = p.alpha + Math.sin(p.pulsePhase) * 0.15;

        // Apply natural floating motion
        p.x += p.vx;
        p.y += p.vy + scrollVelocity * 0.3;

        // Elastic return toward home equilibrium
        const homeDx = p.baseX - p.x;
        const homeDy = p.baseY - p.y;
        p.x += homeDx * 0.008;
        p.y += homeDy * 0.008;

        // Physics reaction to cursor velocity
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < reactRadius) {
            const normDist = 1 - dist / reactRadius;
            // Impulse factor scales with mouse velocity
            const impulse = normDist * (1.5 + Math.min(mouse.speed * 0.12, 12));
            const angle = Math.atan2(dy, dx);
            
            // Push outwards + add subtle swirl
            p.x += Math.cos(angle) * impulse;
            p.y += Math.sin(angle) * impulse;

            // Swirl torque perpendicular to motion
            p.x += -Math.sin(angle) * (mouse.speed * 0.04);
            p.y += Math.cos(angle) * (mouse.speed * 0.04);
          }
        }

        // Screen wrap boundaries
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.05, Math.min(currentAlpha, 0.9))})`;
        ctx.shadowColor = p.color === colors[0] ? '#7c3aed' : '#06b6d4';
        ctx.shadowBlur = p.radius * 4;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow for line drawing efficiency

        // Constellation connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < connectionDistance) {
            const lineAlpha = (1 - cdist / connectionDistance) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(148, 163, 184, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [particleCount, connectionDistance, reactRadius]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 opacity-70 transition-opacity duration-1000 ${className}`}
      aria-hidden="true"
    />
  );
};
