import React, { useEffect, useRef } from 'react';
import { COSMIC_WALLPAPERS, WallpaperItem } from '../services/wallpaperSettingsService';

interface CosmicWallpaperCanvasProps {
  wallpaperId: string;
  customWallpaperUrl?: string;
  customWallpaperType?: 'image' | 'video';
  particleSpeed?: number;
  particleDensity?: number;
  showScanlines?: boolean;
  showHudVignette?: boolean;
}

export const CosmicWallpaperCanvas: React.FC<CosmicWallpaperCanvasProps> = ({
  wallpaperId,
  customWallpaperUrl,
  customWallpaperType = 'image',
  particleSpeed = 1.0,
  particleDensity = 80,
  showScanlines = true,
  showHudVignette = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // If custom image/video is active, the canvas can render a subtle ambient layer or starfield over it
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Current wallpaper metadata
    const wallpaper = COSMIC_WALLPAPERS.find(w => w.id === wallpaperId) || COSMIC_WALLPAPERS[0];

    // Particle system
    const count = Math.min(220, Math.max(30, Math.floor((particleDensity / 100) * (width < 768 ? 50 : 120))));
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      pulse: number;
      color: string;
      angle?: number;
      distance?: number;
    }> = [];

    const colors = [wallpaper.primaryColor, wallpaper.secondaryColor, wallpaper.accentColor, '#ffffff'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.6,
        vx: (Math.random() - 0.5) * 0.8 * particleSpeed,
        vy: (Math.random() - 0.5) * 0.8 * particleSpeed,
        alpha: Math.random() * 0.7 + 0.2,
        pulse: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * (Math.min(width, height) * 0.45)
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015 * particleSpeed;
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Space Base Gradient
      const baseGrad = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, Math.max(width, height) * 0.75
      );

      if (wallpaper.id === 'deep-space-nebula') {
        baseGrad.addColorStop(0, '#1e1035');
        baseGrad.addColorStop(0.5, '#0d0722');
        baseGrad.addColorStop(1, '#02020a');
      } else if (wallpaper.id === 'aurora-borealis') {
        baseGrad.addColorStop(0, '#042018');
        baseGrad.addColorStop(0.5, '#021110');
        baseGrad.addColorStop(1, '#010508');
      } else if (wallpaper.id === 'cosmic-supernova') {
        baseGrad.addColorStop(0, '#381604');
        baseGrad.addColorStop(0.5, '#1a0804');
        baseGrad.addColorStop(1, '#050203');
      } else if (wallpaper.id === 'andromeda-spiral') {
        baseGrad.addColorStop(0, '#220b38');
        baseGrad.addColorStop(0.5, '#0b0620');
        baseGrad.addColorStop(1, '#020108');
      } else if (wallpaper.id === 'void-horizon') {
        baseGrad.addColorStop(0, '#0a0d14');
        baseGrad.addColorStop(0.6, '#030508');
        baseGrad.addColorStop(1, '#000000');
      } else {
        baseGrad.addColorStop(0, '#0c1524');
        baseGrad.addColorStop(0.5, '#060a14');
        baseGrad.addColorStop(1, '#020308');
      }

      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Specific Cosmic Atmosphere Effects
      if (wallpaper.id === 'aurora-borealis') {
        // Flowing Aurora Ribbons
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let r = 0; r < 3; r++) {
          ctx.beginPath();
          ctx.moveTo(0, height * 0.35 + r * 60);
          for (let x = 0; x <= width; x += 25) {
            const waveY =
              Math.sin(x * 0.003 + time * 1.5 + r) * 70 +
              Math.cos(x * 0.007 - time * 0.8) * 40;
            ctx.lineTo(x, height * 0.35 + waveY + r * 50);
          }
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();

          const ribbonGrad = ctx.createLinearGradient(0, height * 0.2, 0, height * 0.85);
          ribbonGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
          ribbonGrad.addColorStop(0.3, r === 0 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(6, 182, 212, 0.22)');
          ribbonGrad.addColorStop(0.7, 'rgba(16, 185, 129, 0.12)');
          ribbonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = ribbonGrad;
          ctx.fill();
        }
        ctx.restore();
      } else if (wallpaper.id === 'deep-space-nebula' || wallpaper.id === 'galactic-dust-pillars') {
        // Organic glowing gas clouds
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const cloudCount = 4;
        for (let c = 0; c < cloudCount; c++) {
          const cx = width * (0.3 + 0.4 * Math.sin(time * 0.2 + c * 1.8));
          const cy = height * (0.35 + 0.3 * Math.cos(time * 0.25 + c * 2.1));
          const cradius = Math.min(width, height) * (0.35 + 0.15 * Math.sin(time * 0.3 + c));

          const cloudGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, cradius);
          cloudGrad.addColorStop(0, c % 2 === 0 ? 'rgba(139, 92, 246, 0.28)' : 'rgba(6, 182, 212, 0.25)');
          cloudGrad.addColorStop(0.5, c % 2 === 0 ? 'rgba(236, 72, 153, 0.12)' : 'rgba(59, 130, 246, 0.10)');
          cloudGrad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.fillStyle = cloudGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, cradius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (wallpaper.id === 'starlight-cybergrid') {
        // Undulating 3D perspective grid
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.lineWidth = 1;
        const horizon = height * 0.65;
        const vanishingX = width / 2;

        // Perspective lines converging to horizon
        for (let x = -width; x <= width * 2; x += 90) {
          ctx.beginPath();
          ctx.moveTo(vanishingX, horizon);
          ctx.lineTo(x + Math.sin(time + x * 0.01) * 30, height);
          ctx.stroke();
        }

        // Horizontal lines moving forward
        const gridSpeed = (time * 40) % 50;
        for (let y = horizon; y <= height; y += 22) {
          const actualY = y + gridSpeed * ((y - horizon) / (height - horizon));
          if (actualY <= height) {
            ctx.beginPath();
            ctx.moveTo(0, actualY);
            ctx.lineTo(width, actualY);
            ctx.stroke();
          }
        }
        ctx.restore();
      } else if (wallpaper.id === 'quantum-singularity') {
        // Gravitational lensing ring
        ctx.save();
        const centerX = width / 2;
        const centerY = height / 2;
        const ringRadius = Math.min(width, height) * 0.22;

        const accretionGrad = ctx.createRadialGradient(
          centerX, centerY, ringRadius * 0.7,
          centerX, centerY, ringRadius * 1.5
        );
        accretionGrad.addColorStop(0, 'rgba(0,0,0,0.95)');
        accretionGrad.addColorStop(0.3, 'rgba(34, 211, 238, 0.45)');
        accretionGrad.addColorStop(0.7, 'rgba(99, 102, 241, 0.25)');
        accretionGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = accretionGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Event Horizon Core (Black Hole center)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      } else if (wallpaper.id === 'hyperdrive-warp') {
        // Relativistic speed star streaks
        ctx.save();
        const cx = width / 2;
        const cy = height / 2;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.8;

        particles.forEach(p => {
          p.distance = ((p.distance || 50) + 7 * particleSpeed) % (Math.max(width, height) * 0.75);
          const angle = p.angle || 0;
          const sx = cx + Math.cos(angle) * (p.distance * 0.8);
          const sy = cy + Math.sin(angle) * (p.distance * 0.8);
          const ex = cx + Math.cos(angle) * p.distance;
          const ey = cy + Math.sin(angle) * p.distance;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        });
        ctx.restore();
      }

      // 3. Render Interstellar Particle Dust & Nodes
      particles.forEach((p, idx) => {
        if (wallpaper.id !== 'hyperdrive-warp') {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          p.pulse += 0.03 * particleSpeed;
          const currentAlpha = Math.max(0.1, p.alpha + Math.sin(p.pulse) * 0.25);

          ctx.fillStyle = p.color;
          ctx.globalAlpha = currentAlpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          // Connect close nodes in constellation mode
          if (wallpaper.id === 'neon-constellation' || wallpaper.id === 'celestial-particles') {
            for (let j = idx + 1; j < Math.min(idx + 12, particles.length); j++) {
              const p2 = particles[j];
              const dx = p.x - p2.x;
              const dy = p.y - p2.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 110) {
                ctx.strokeStyle = wallpaper.primaryColor;
                ctx.globalAlpha = (1 - dist / 110) * 0.25;
                ctx.lineWidth = 0.75;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            }
          }
        }
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [wallpaperId, customWallpaperUrl, particleSpeed, particleDensity]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* If custom wallpaper image or video is loaded from Cloudinary */}
      {customWallpaperUrl && (
        <div className="absolute inset-0 z-0">
          {customWallpaperType === 'video' ? (
            <video
              ref={videoRef}
              src={customWallpaperUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover filter brightness-75 contrast-110"
            />
          ) : (
            <img
              src={customWallpaperUrl}
              alt="Custom Wallpaper"
              className="w-full h-full object-cover filter brightness-85 contrast-105"
            />
          )}
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />
        </div>
      )}

      {/* Dynamic Animated Cosmic Canvas */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${customWallpaperUrl ? 'mix-blend-screen opacity-60' : 'opacity-100'}`}
      />

      {/* Optional Scanlines & Vignette */}
      {showScanlines && <div className="jarvis-scanline opacity-75" />}
      {showHudVignette && <div className="jarvis-hud-vignette opacity-80" />}
    </div>
  );
};
