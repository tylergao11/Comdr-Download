import { useEffect, useRef } from "react";

/* ═════════════════════════════════════════════════════════
   HeroStarfield — 深空星空背景
   280 颗银白星点 + 鼠标视差 + 流星雨
   ═════════════════════════════════════════════════════════ */

interface Star {
  x: number; y: number; r: number;
  hue: number; sat: number;
  phase: number; speed: number;
  driftX: number; driftY: number;
  depth: number; // 0=far → 1=near, 控制视差强度
}

interface Meteor {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  trail: { x: number; y: number }[];
}

function makeStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i * 131 + 47;
    const depth = ((seed * 13) % 100) / 100;
    return {
      x: ((seed * 19) % 1000) / 1000,
      y: ((seed * 37) % 1000) / 1000,
      r: 0.25 + depth * 1.4 + ((seed * 11) % 8) / 10,
      hue: 210 + ((seed * 7) % 30),
      sat: 8 + ((seed * 3) % 14),
      phase: ((seed * 17) % 1000) / 1000 * Math.PI * 2,
      speed: 0.4 + depth * 1.6,
      depth,
      driftX: (seed % 2 === 0 ? 1 : -1) * (0.003 + depth * 0.012),
      driftY: (seed % 3 === 0 ? 1 : -1) * (0.002 + depth * 0.008),
    };
  });
}

function spawnMeteor(w: number, h: number): Meteor {
  const angle = Math.PI * 0.25 + Math.random() * Math.PI * 0.5; // 45°–135°
  const speed = 600 + Math.random() * 400;
  return {
    x: Math.random() * w,
    y: -20 - Math.random() * 200,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 0.7 + Math.random() * 0.6,
    trail: [],
  };
}

const STAR_COUNT = 280;
const PARALLAX_FACTOR = 22;
const TRAIL_MAX = 36;

export function HeroStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const meteorsRef = useRef<Meteor[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 }); // 归一化 -1..1
  const rafRef = useRef(0);
  const elapsedRef = useRef(0);
  const meteorTimerRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    starsRef.current = makeStars(STAR_COUNT);
    let width = 0;
    let height = 0;
    let running = true;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / width - 0.5) * 2,  // -1..1
        y: (e.clientY / height - 0.5) * 2,
      };
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouse, { passive: true });

    const render = (now: number) => {
      if (!running) return;

      const t = now / 1000;
      const dt = Math.min(t - elapsedRef.current, 0.1);
      elapsedRef.current = t;

      ctx.clearRect(0, 0, width, height);

      // ── 鼠标视差偏移 ──
      const mx = mouseRef.current.x * PARALLAX_FACTOR;
      const my = mouseRef.current.y * PARALLAX_FACTOR;

      // ── 星空旋转 ──
      const rotateAngle = t * 0.015;
      const cosA = Math.cos(rotateAngle);
      const sinA = Math.sin(rotateAngle);

      for (const star of starsRef.current) {
        let sx = (star.x + t * star.driftX) % 1;
        let sy = (star.y + t * star.driftY) % 1;
        if (sx < 0) sx += 1;
        if (sy < 0) sy += 1;

        const cx = sx - 0.5;
        const cy = sy - 0.5;
        const rx = cx * cosA - cy * sinA + 0.5;
        const ry = cx * sinA + cy * cosA + 0.5;

        // 视差：深层不动，近层跟随鼠标
        const parallax = star.depth * star.depth; // depth² 拉开层次
        let px = rx * width + mx * parallax;
        let py = ry * height + my * parallax;

        const twinkle = 0.55 + Math.sin(t * star.speed + star.phase) * 0.45;
        const brightness = 68 + twinkle * 24;
        const alpha = (0.06 + twinkle * 0.28) * (0.5 + star.depth * 0.5);

        ctx.fillStyle = `hsla(${star.hue}, ${star.sat}%, ${brightness}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, star.r * (0.7 + twinkle * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }

      // ── 流星雨 ──
      // 每 3-8 秒随机生成一颗
      meteorTimerRef.current -= dt;
      if (meteorTimerRef.current <= 0) {
        meteorsRef.current.push(spawnMeteor(width, height));
        meteorTimerRef.current = 3 + Math.random() * 5;
      }

      const meteors = meteorsRef.current;
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life += dt;
        if (m.life >= m.maxLife) {
          meteors.splice(i, 1);
          continue;
        }
        m.x += m.vx * dt;
        m.y += m.vy * dt;

        // 记录拖尾点
        m.trail.push({ x: m.x, y: m.y });
        if (m.trail.length > TRAIL_MAX) m.trail.shift();

        // 绘制流星拖尾
        const progress = m.life / m.maxLife;
        const headAlpha = 1 - progress;

        if (m.trail.length > 1) {
          ctx.strokeStyle = `rgba(220,230,245,${headAlpha * 0.7})`;
          ctx.lineWidth = 1.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(m.trail[0].x, m.trail[0].y);
          for (let ti = 1; ti < m.trail.length; ti++) {
            ctx.lineTo(m.trail[ti].x, m.trail[ti].y);
          }
          ctx.stroke();

          // 头部亮光
          ctx.fillStyle = `rgba(255,255,255,${headAlpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 1.6, 0, Math.PI * 2);
          ctx.fill();

          // 头部辉光
          const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 8);
          glow.addColorStop(0, `rgba(255,255,255,${headAlpha * 0.5})`);
          glow.addColorStop(1, "rgba(200,215,235,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-starfield" aria-hidden="true" />;
}
