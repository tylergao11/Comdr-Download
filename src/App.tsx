import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HeroStarfield } from "./components/HeroStarfield";
import {
  ConstellationGraph,
  STARS,
  type StarNode,
} from "./components/ConstellationGraph";
// ═════════════════════════════════════════════════════════
//  App
// ═════════════════════════════════════════════════════════

export function App() {
  return (
    <>
      <HeroStarfield />
      <CursorGlow />
      <main className="site">
        <Hero />
      </main>
    </>
  );
}

// ═════════════════════════════════════════════════════════
//  CursorGlow — 星尘拖尾（Web Animations API，避免 React 重渲染）
// ═════════════════════════════════════════════════════════

function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const prevAnimRef = useRef<Animation | null>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    const onMove = (e: MouseEvent) => {
      prevAnimRef.current?.cancel();
      prevAnimRef.current = glow.animate(
        { left: `${e.clientX}px`, top: `${e.clientY}px` },
        { duration: 600, fill: "forwards", easing: "ease-out" },
      );
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      prevAnimRef.current?.cancel();
    };
  }, []);

  return <div ref={glowRef} className="cursor-glow" aria-hidden="true" />;
}

// ═════════════════════════════════════════════════════════
//  Hero — 诗词 ⇄ 星座执行流
//  phase: 'poem' | 'transitioning' | 'flow'
// ═════════════════════════════════════════════════════════

type Phase = "poem" | "transitioning" | "flow";

// ── 诗词静态数据 ──

const POEM = [
  "星光横渡深空落入眼眸",
  "数据穿行总线汇聚一团",
  "真实亦或虚幻",
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
  const [actProgress, setActProgress] = useState(0); // 线性，驱动文案切换
  const [hasVisitedFlow, setHasVisitedFlow] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const rafRef = useRef(0);
  const flowStartRef = useRef(0);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout>>(0);

  // ══ 进入执行流 ══

  const handleWatchFlow = () => {
    if (phase !== "poem") return;
    setFlowProgress(0);
    setActProgress(0); // 文案也从零开始
    setHasVisitedFlow(true);
    setPhase("transitioning");
    transitionTimerRef.current = setTimeout(() => {
      setPhase("flow");
    }, 700);
  };

  // ══ 回到诗词 ══

  const handleBackToPoem = () => {
    if (phase !== "flow") return;
    cancelAnimationFrame(rafRef.current);
    clearTimeout(transitionTimerRef.current);
    setSelectedNodeId(null);
    setPhase("poem"); // 直接切回，AnimatePresence 同时处理星座淡出 + 诗词淡入
  };

  // ══ 星座自动播放 RAF ══

  useEffect(() => {
    if (phase !== "flow") return;

    const DURATION = 10000;
    flowStartRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - flowStartRef.current;
      const raw = Math.min(1, elapsed / DURATION);
      const t =
        raw < 0.5
          ? 4 * raw * raw * raw
          : 1 - Math.pow(-2 * raw + 2, 3) / 2;
      setFlowProgress(t);
      setActProgress(raw); // 线性进度，驱动文案均匀切换
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

  // ══ 节点点击 ══

  const handleNodeClick = (nodeId: number) => {
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
  };

  const selectedStar = selectedNodeId !== null
    ? STARS.find((s) => s.id === selectedNodeId) ?? null
    : null;

  // ══════════════════════════════════════════════
  //  Render
  // ══════════════════════════════════════════════

  return (
    <section className="hero" id="graph">
      {/* ── 诗词 + 按钮 ── */}
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
                <button
                  className="btn-primary"
                  onClick={handleWatchFlow}
                >
                  观看执行流
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 星座执行流 ── */}
      <AnimatePresence>
        {phase !== "poem" && (
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
            />

            {/* 节点详情面板 */}
            <NodeDetail star={selectedStar} />

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
    </section>
  );
}

// ═════════════════════════════════════════════════════════
//  NodeDetail — 左侧详情面板
// ═════════════════════════════════════════════════════════

function NodeDetail({ star }: { star: StarNode | null }) {
  return (
    <AnimatePresence mode="wait">
      {star && (
        <motion.div
          key={star.id}
          className="node-detail"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.p
            className="node-detail-desc"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
          >
            {star.description}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═════════════════════════════════════════════════════════
//  FloatingNav — 右下角导航
//  诗词页 ↓  执行流页 ↑
// ═════════════════════════════════════════════════════════

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
  const visible = phase === "poem" || phase === "flow";
  const enterDelay = isPoem ? (hasVisitedFlow ? 0.3 : 2.0) : 0.5;

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.button
          key={phase}
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
          aria-label={isPoem ? "观看执行流" : "返回诗词"}
        >
          <span className={`floating-nav-chevron ${isPoem ? "down" : "up"}`} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
