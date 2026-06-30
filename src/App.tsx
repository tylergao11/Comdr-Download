import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HeroStarfield } from "./components/HeroStarfield";
import {
  ConstellationGraph,
  STARS,
  type StarNode,
} from "./components/ConstellationGraph";
import { DesignArchitecture } from "./components/DesignArchitecture";
import { InstallFlow } from "./components/InstallFlow";

/* ═══════════════════════════════════════════════════════════════════
   App
   ═══════════════════════════════════════════════════════════════════ */

export function App() {
  return (
    <>
      {/* ══ 背景层 ══ */}
      <HeroStarfield />


      {/* ══ 光标辉光 — 直接跟随 ══ */}
      <CursorGlow />

      <main className="site">
        <Hero />
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CursorGlow — 光标驱动的柔和辉光
   直接跟随鼠标，不做百分比换算，避免锚点漂移
   ═══════════════════════════════════════════════════════════════════ */

function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);
  const rafRef = useRef(0);
  const targetRef = useRef({ x: -200, y: -200 });
  const sizeRef = useRef({ w: 380, h: 260 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 触屏设备无光标，直接跳过，不启动 RAF
    if (!window.matchMedia("(hover: hover)").matches) return;

    // 缓存元素尺寸，只在 resize 时更新，避免每帧 getBoundingClientRect 重排
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
    };
    updateSize();

    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      if (!activeRef.current) {
        activeRef.current = true;
        el.classList.add("cursor-glow--active");
      }
    };

    const onLeave = () => {
      activeRef.current = false;
      el.classList.remove("cursor-glow--active");
    };

    let currentX = -200;
    let currentY = -200;

    const tick = () => {
      const { w, h } = sizeRef.current;
      const tx = targetRef.current.x - w / 2;
      const ty = targetRef.current.y - h / 2;
      currentX += (tx - currentX) * 0.12;
      currentY += (ty - currentY) * 0.12;
      el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", updateSize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}

/* ═══════════════════════════════════════════════════════════════════
   Hero — 首页 ⇄ 星座执行流 ⇄ 设计思路
   phase: 'poem' | 'transitioning' | 'flow' | 'design'
   ═══════════════════════════════════════════════════════════════════ */

type Phase = "poem" | "transitioning" | "flow" | "design";

const POEM = [
  "星光横渡深空难觅影踪",
  "数据穿行总线落入眼眸",
  "真实亦或虚构",
];

const charVariants = {
  hidden: { opacity: 0.05, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

const lineVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.35,
    },
  },
};

const poemVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 1.6,
      delayChildren: 0.3,
    },
  },
};

function Hero() {
  const [phase, setPhase] = useState<Phase>("poem");
  const [flowProgress, setFlowProgress] = useState(0);
  const [actProgress, setActProgress] = useState(0);
  const [hasVisitedFlow, setHasVisitedFlow] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const rafRef = useRef(0);
  const flowStartRef = useRef(0);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout>>(0);
  const carouselRef = useRef<ReturnType<typeof setInterval>>(0);
  const manualRef = useRef(false);

  // ══ 进入执行流 ══

  const handleWatchFlow = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(transitionTimerRef.current);
    clearInterval(carouselRef.current);
    manualRef.current = false;
    setSelectedNodeId(null);
    setFlowProgress(0);
    setActProgress(0);
    setHasVisitedFlow(true);
    setPhase("transitioning");
    transitionTimerRef.current = setTimeout(() => {
      setPhase("flow");
    }, 700);
  }, []);

  // ══ 进入设计思路 ══

  const handleWatchDesign = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(transitionTimerRef.current);
    setSelectedNodeId(null);
    setHasVisitedFlow(true);
    setPhase("design");
  }, []);

  // ══ 回到首页 ══

  const handleBackToPoem = useCallback(() => {
    if (phase === "poem") return;
    cancelAnimationFrame(rafRef.current);
    clearTimeout(transitionTimerRef.current);
    setSelectedNodeId(null);
    setPhase("poem");
  }, [phase]);

  // ══ 节点点击 ══

  const handleNodeClick = useCallback((nodeId: number) => {
    setSelectedNodeId((prev) => {
      if (prev === nodeId) {
        manualRef.current = false;
        return (nodeId + 1) % STARS.length;
      } else {
        manualRef.current = true;
        return nodeId;
      }
    });
  }, []);

  const selectedStar = selectedNodeId !== null
    ? STARS.find((s) => s.id === selectedNodeId) ?? null
    : null;

  // ══ 星座动画 RAF ══

  useEffect(() => {
    if (phase !== "flow") return;

    setSelectedNodeId(0);

    const DURATION = 6000;
    flowStartRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - flowStartRef.current;
      const raw = Math.min(1, elapsed / DURATION);
      const t = 1 - Math.pow(1 - raw, 3);
      setFlowProgress(t);
      setActProgress(raw);
      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(transitionTimerRef.current);
    };
  }, [phase]);

  // ══ 完成态自动轮播 ══

  const isFlowComplete = flowProgress >= 1;

  useEffect(() => {
    if (phase !== "flow" || !isFlowComplete) {
      clearInterval(carouselRef.current);
      return;
    }

    if (selectedNodeId === null && !manualRef.current) {
      setSelectedNodeId(0);
    }

    carouselRef.current = setInterval(() => {
      if (manualRef.current) return;
      setSelectedNodeId((prev) => {
        if (prev === null) return 0;
        return (prev + 1) % STARS.length;
      });
    }, 8000);

    return () => clearInterval(carouselRef.current);
  }, [phase, isFlowComplete]);

  // ══════════════════════════════════════════════
  //  Render
  // ══════════════════════════════════════════════

  return (
    <section className="hero" id="graph">
      {/* ── 首页诗 + 按钮 ── */}
      <AnimatePresence>
        {phase === "poem" && (
          <motion.div
            className="hero-copy"
            key="poem-stage"
            exit={{
              opacity: 0,
              filter: "blur(12px)",
              y: -20,
              transition: { duration: 0.6, ease: "easeInOut" },
            }}
          >
            <motion.div
              className="hero-poem"
              variants={poemVariants}
              initial="hidden"
              animate="visible"
            >
              {POEM.map((line, lineIdx) => {
                const isLast = lineIdx === POEM.length - 1;
                return (
                  <motion.p
                    key={lineIdx}
                    className="hero-poem-line"
                    variants={lineVariants}
                  >
                    {[...line].map((ch, charIdx) => (
                      <motion.span
                        key={charIdx}
                        variants={charVariants}
                        style={{
                          display: "inline-block",
                          whiteSpace: ch === " " ? "pre" : "normal",
                        }}
                      >
                        {ch}
                      </motion.span>
                    ))}
                    {isLast && (
                      <span className="hero-dots">
                        <span className="hero-dot">.</span>
                        <span className="hero-dot">.</span>
                        <span className="hero-dot">.</span>
                      </span>
                    )}
                  </motion.p>
                );
              })}
            </motion.div>

            <div className="hero-cta-zone">
              <motion.div
                className="hero-actions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 1.4,
                  delay: 2.0,
                  ease: "easeOut" as const,
                }}
              >
                <button className="btn-primary" onClick={handleWatchFlow}>
                  我的优势
                </button>
                <span className="hero-actions-sep" aria-hidden="true" />
                <button className="btn-primary" onClick={handleWatchDesign}>
                  观看执行流
                </button>
              </motion.div>
            </div>

            {/* 滚动指示器 */}
            <ScrollIndicator />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 星座执行流 ── */}
      <AnimatePresence>
        {(phase === "transitioning" || phase === "flow") && (
          <motion.div
            className="constellation-stage"
            key="flow-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <ConstellationGraph
              progress={flowProgress}
              actProgress={actProgress}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNodeId}
            />
            <NodeDetail star={selectedStar} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 设计思路 ── */}
      <AnimatePresence>
        {phase === "design" && (
          <motion.div
            className="design-stage"
            key="design-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <DesignArchitecture />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 右下浮动导航 ── */}
      <FloatingNav
        phase={phase}
        hasVisitedFlow={hasVisitedFlow}
        onWatchFlow={handleWatchFlow}
        onBackToPoem={handleBackToPoem}
      />

      <InstallFlow
        phase={phase}
        onWatchFlow={handleWatchFlow}
        onWatchDesign={handleWatchDesign}
        onBackToPoem={handleBackToPoem}
      />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ScrollIndicator — 底部滚轮提示（仅首页可见）
   ═══════════════════════════════════════════════════════════════════ */

function ScrollIndicator() {
  return (
    <div className="scroll-indicator" aria-hidden="true">
      <div className="scroll-indicator__line" />
      <span className="scroll-indicator__text">向下滚动</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   NodeDetail — 融入深空的透明文字
   ═══════════════════════════════════════════════════════════════════ */

function NodeDetail({ star }: { star: StarNode | null }) {
  return (
    <AnimatePresence mode="wait">
      {star && (
        <motion.div
          key={star.id}
          className="node-detail"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.p
            className="node-detail-label"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.55, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          >
            {star.label}
          </motion.p>
          <motion.p
            className="node-detail-desc"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.45, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            {star.description}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FloatingNav — 右下角导航
   ═══════════════════════════════════════════════════════════════════ */

function FloatingNav({
  phase,
  hasVisitedFlow,
  onWatchFlow,
  onBackToPoem,
}: {
  phase: Phase;
  hasVisitedFlow: boolean;
  onWatchFlow: () => void;
  onBackToPoem: () => void;
}) {
  const isPoem = phase === "poem";
  const navKey = isPoem ? "poem" : "sub";
  const enterDelay = isPoem ? (hasVisitedFlow ? 0.3 : 2.0) : 0.5;

  return (
    <AnimatePresence mode="wait">
      <motion.button
        key={navKey}
        className="floating-nav"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          duration: 0.3,
          delay: enterDelay,
          ease: "easeOut",
        }}
        onClick={isPoem ? onWatchFlow : onBackToPoem}
        aria-label={isPoem ? "观看执行流" : "返回首页"}
      >
        <span className={`floating-nav-chevron ${isPoem ? "down" : "up"}`} />
      </motion.button>
    </AnimatePresence>
  );
}
