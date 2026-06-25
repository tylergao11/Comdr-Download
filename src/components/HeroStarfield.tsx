import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  hue: number;
  phase: number;
  speed: number;
  drift: number;
}

function makeStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i * 131 + 47;
    return {
      x: ((seed * 19) % 1000) / 1000,
      y: ((seed * 37) % 1000) / 1000,
      r: 0.35 + ((seed * 11) % 18) / 12,
      hue: 210 + ((seed * 7) % 44),
      phase: ((seed * 17) % 1000) / 1000 * Math.PI * 2,
      speed: 0.18 + ((seed * 23) % 100) / 210,
      drift: 0.3 + ((seed * 29) % 100) / 100,
    };
  });
}

const STAR_COUNT = 180;

export function HeroStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const gradientRef = useRef<{ core: CanvasGradient | null; belt: CanvasGradient | null }>({
    core: null,
    belt: null,
  });
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    starsRef.current = makeStars(STAR_COUNT);
    let width = 0;
    let height = 0;
    let running = true;

    // Pause rendering when less than 10% visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 },
    );
    observer.observe(canvas);

    // Build both gradients on resize — reused across all frames
    const buildGradients = () => {
      const g = gradientRef.current;
      g.core = ctx.createRadialGradient(
        width * 0.56,
        height * 0.36,
        0,
        width * 0.56,
        height * 0.36,
        Math.max(width, height) * 0.74,
      );
      g.core.addColorStop(0, "rgba(125,167,255,0.10)");
      g.core.addColorStop(0.42, "rgba(82,224,207,0.040)");
      g.core.addColorStop(1, "rgba(0,0,0,0)");

      g.belt = ctx.createLinearGradient(0, height * 0.18, width, height * 0.82);
      g.belt.addColorStop(0, "rgba(0,0,0,0)");
      g.belt.addColorStop(0.42, "rgba(181,156,255,0.060)");
      g.belt.addColorStop(0.54, "rgba(244,200,106,0.038)");
      g.belt.addColorStop(0.70, "rgba(82,224,207,0.038)");
      g.belt.addColorStop(1, "rgba(0,0,0,0)");
    };

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent?.clientWidth || window.innerWidth;
      height = parent?.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGradients();
    };

    resize();
    window.addEventListener("resize", resize);

    const render = (now: number) => {
      if (!running) return;

      // Skip drawing when offscreen, but keep RAF alive for re-entry
      if (!visibleRef.current) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const t = now / 1000;
      ctx.clearRect(0, 0, width, height);

      // Use cached gradients (built on resize, no per-frame allocations)
      const { core, belt } = gradientRef.current;
      if (core) {
        ctx.fillStyle = core;
        ctx.fillRect(0, 0, width, height);
      }
      if (belt) {
        ctx.fillStyle = belt;
        ctx.fillRect(0, 0, width, height);
      }

      for (const star of starsRef.current) {
        const twinkle = 0.55 + Math.sin(t * star.speed + star.phase) * 0.45;
        const x = (star.x + Math.sin(t * 0.012 + star.phase) * 0.006 * star.drift) * width;
        const y = (star.y + Math.cos(t * 0.010 + star.phase) * 0.006 * star.drift) * height;
        const a = 0.11 + twinkle * 0.32;
        ctx.fillStyle = `hsla(${star.hue}, 30%, ${72 + twinkle * 20}%, ${a})`;
        ctx.beginPath();
        ctx.arc(x, y, star.r * (0.78 + twinkle * 0.35), 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-starfield" aria-hidden="true" />;
}
