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

export function HeroStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    starsRef.current = makeStars(260);
    let width = 0;
    let height = 0;
    let running = true;

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
    };

    resize();
    window.addEventListener("resize", resize);

    const render = (now: number) => {
      if (!running) return;
      const t = now / 1000;
      ctx.clearRect(0, 0, width, height);

      const core = ctx.createRadialGradient(width * 0.56, height * 0.36, 0, width * 0.56, height * 0.36, Math.max(width, height) * 0.74);
      core.addColorStop(0, "rgba(125,167,255,0.10)");
      core.addColorStop(0.42, "rgba(82,224,207,0.040)");
      core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, width, height);

      const belt = ctx.createLinearGradient(0, height * 0.18 + Math.sin(t * 0.08) * 20, width, height * 0.82);
      belt.addColorStop(0, "rgba(0,0,0,0)");
      belt.addColorStop(0.42, "rgba(181,156,255,0.060)");
      belt.addColorStop(0.54, "rgba(244,200,106,0.038)");
      belt.addColorStop(0.70, "rgba(82,224,207,0.038)");
      belt.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = belt;
      ctx.fillRect(0, 0, width, height);

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

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
    return () => {
      running = false;
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-starfield" aria-hidden="true" />;
}
