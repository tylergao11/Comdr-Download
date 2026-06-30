import { useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════
   HeroStarfield — 深空星空背景
   320 颗银白星点，四层 tier 呼吸系统，鼠标视差，流星雨，星芒辉光
   超越 View：CSS 变量驱动的光标辉光联动 + 多层次星云
   ═══════════════════════════════════════════════════════════════════ */

// ── Tier 系统（对齐 Comdr View color.ts） ──

type StarTier = 1 | 2 | 3 | 4;

interface TierConfig {
  period: number;    // 呼吸周期 ms
  amplitude: number; // 呼吸幅度 0-1
  baseAlpha: number;
  sizeRange: [number, number]; // [min, max] radius
  colorTemp: [number, number]; // hue range (210=cool, 230=warm)
}

const TIER_CONFIG: Record<StarTier, TierConfig> = {
  1: { period: 5600, amplitude: 0.025, baseAlpha: 0.85, sizeRange: [1.6, 2.8], colorTemp: [215, 228] }, // polaris — 慢深呼吸
  2: { period: 3600, amplitude: 0.045, baseAlpha: 0.72, sizeRange: [0.9, 1.8], colorTemp: [210, 225] }, // planetary
  3: { period: 2200, amplitude: 0.06,  baseAlpha: 0.55, sizeRange: [0.4, 1.1], colorTemp: [208, 222] }, // stellar
  4: { period: 900,  amplitude: 0.08,  baseAlpha: 0.38, sizeRange: [0.2, 0.6], colorTemp: [205, 218] }, // twinkle — 快闪微尘
};

const TIER_DISTRIBUTION: StarTier[] = [1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4]; // 少 tier1，多 tier4

interface Star {
  x: number; y: number;
  r: number;
  hue: number; sat: number;
  phase: number;
  depth: number;      // 0=far → 1=near，控制视差
  tier: StarTier;
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
    const lo = ((seed * 13) % 100) / 100;
    const hi = ((seed * 29 + 71) % 100) / 100;
    const depth = lo * 0.6 + hi * 0.4; // 混合噪声，更多中层星

    // 根据深度分配 tier（深层 → 高 tier，近层 → 低 tier）
    const tierIdx = Math.min(
      TIER_DISTRIBUTION.length - 1,
      Math.floor(depth * TIER_DISTRIBUTION.length + ((seed * 7) % 3) - 1)
    );
    const tier = TIER_DISTRIBUTION[Math.max(0, tierIdx)];

    const config = TIER_CONFIG[tier];
    const sizeRange = config.sizeRange;

    return {
      x: ((seed * 19) % 1000) / 1000,
      y: ((seed * 37) % 1000) / 1000,
      r: sizeRange[0] + ((seed * 11) % 100) / 100 * (sizeRange[1] - sizeRange[0]),
      hue: config.colorTemp[0] + ((seed * 7) % 100) / 100 * (config.colorTemp[1] - config.colorTemp[0]),
      sat: 6 + ((seed * 3) % 10),
      phase: ((seed * 17) % 1000) / 1000 * Math.PI * 2,
      depth,
      tier,
    };
  });
}

function spawnMeteor(w: number, h: number): Meteor {
  const angle = Math.PI * 0.25 + Math.random() * Math.PI * 0.5; // 45°–135°
  const speed = 500 + Math.random() * 500;
  return {
    x: Math.random() * w,
    y: -20 - Math.random() * 200,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 0.6 + Math.random() * 0.7,
    trail: [],
  };
}

const STAR_COUNT = 320;
const PARALLAX_FACTOR = 26;
const TRAIL_MAX = 42;

export function HeroStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const meteorsRef = useRef<Meteor[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
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
        x: (e.clientX / width - 0.5) * 2,
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

      const mx = mouseRef.current.x * PARALLAX_FACTOR;
      const my = mouseRef.current.y * PARALLAX_FACTOR;

      const rotateAngle = t * 0.012;
      const cosA = Math.cos(rotateAngle);
      const sinA = Math.sin(rotateAngle);

      for (const star of starsRef.current) {
        const config = TIER_CONFIG[star.tier];

        // 天球漂移
        let sx = (star.x + t * (0.003 + star.depth * 0.01)) % 1;
        let sy = (star.y + t * (0.002 + star.depth * 0.007)) % 1;
        if (sx < 0) sx += 1;
        if (sy < 0) sy += 1;

        const cx = sx - 0.5;
        const cy = sy - 0.5;
        const rx = cx * cosA - cy * sinA + 0.5;
        const ry = cx * sinA + cy * cosA + 0.5;

        // 视差
        const parallax = star.depth * star.depth;
        let px = rx * width + mx * parallax;
        let py = ry * height + my * parallax;

        // Tier 呼吸
        const breathPhase = (t * 1000) / config.period * Math.PI * 2 + star.phase;
        const breath = Math.sin(breathPhase) * config.amplitude;
        const twinkle = 0.55 + Math.sin(t * (0.5 + star.depth * 1.8) + star.phase) * 0.45;

        const alpha = (config.baseAlpha + breath) * (0.5 + star.depth * 0.5);
        const brightness = 68 + twinkle * 20 + star.depth * 10;

        // 主星点
        ctx.fillStyle = `hsla(${star.hue}, ${star.sat}%, ${brightness}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, star.r * (0.7 + twinkle * 0.4), 0, Math.PI * 2);
        ctx.fill();

        // Tier 1/2 星芒辉光（中远层亮星）
        if (star.tier <= 2 && star.depth > 0.4) {
          const glowAlpha = alpha * 0.25;
          const glow = ctx.createRadialGradient(px, py, 0, px, py, star.r * 4.5);
          glow.addColorStop(0, `hsla(${star.hue}, ${star.sat}%, ${brightness + 20}%, ${glowAlpha})`);
          glow.addColorStop(1, "rgba(200,215,235,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(px, py, star.r * 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Tier 1 十字星芒
        if (star.tier === 1 && star.depth > 0.5) {
          const flareAlpha = alpha * 0.15;
          ctx.strokeStyle = `rgba(228,235,245,${flareAlpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(px - star.r * 3, py);
          ctx.lineTo(px + star.r * 3, py);
          ctx.moveTo(px, py - star.r * 3);
          ctx.lineTo(px, py + star.r * 3);
          ctx.stroke();
        }
      }

      // ── 流星雨 ──
      meteorTimerRef.current -= dt;
      if (meteorTimerRef.current <= 0) {
        meteorsRef.current.push(spawnMeteor(width, height));
        meteorTimerRef.current = 2.5 + Math.random() * 4.5;
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

        m.trail.push({ x: m.x, y: m.y });
        if (m.trail.length > TRAIL_MAX) m.trail.shift();

        const progress = m.life / m.maxLife;
        const headAlpha = 1 - progress;

        if (m.trail.length > 1) {
          // 拖尾
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
          ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // 头部辉光
          const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 10);
          glow.addColorStop(0, `rgba(255,255,255,${headAlpha * 0.5})`);
          glow.addColorStop(1, "rgba(200,215,235,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 10, 0, Math.PI * 2);
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
