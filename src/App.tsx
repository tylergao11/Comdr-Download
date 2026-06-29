import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HeroStarfield } from "./components/HeroStarfield";
import {
  ConstellationGraph,
  STARS,
  type StarNode,
} from "./components/ConstellationGraph";
import { DesignArchitecture } from "./components/DesignArchitecture";
import { InstallFlow } from "./components/InstallFlow";
// ═════════════════════════════════════════════════════════
//  App
// ═════════════════════════════════════════════════════════

export function App() {
  return (
    <>
      <HeroStarfield />
      <main className="site">
        <Hero />
      </main>
    </>
  );
}

// ═════════════════════════════════════════════════════════
//  Hero — 首页 ⇄ 我的优势 / 观看执行流
//  phase: 'poem' | 'transitioning' | 'flow' | 'design'
// ═════════════════════════════════════════════════════════

type Phase = "poem" | "transitioning" | "flow" | "design";

// ── 首页静态数据 ──

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
  const [actProgress, setActProgress] = useState(0); // 线性，驱动文案切换
  const [hasVisitedFlow, setHasVisitedFlow] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const rafRef = useRef(0);
  const flowStartRef = useRef(0);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout>>(0);
  const carouselRef = useRef<ReturnType<typeof setInterval>>(0);
  const manualRef = useRef(false);

  // ══ 进入执行流 ══

  const handleWatchFlow = () => {
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
  };

  // ══ 进入设计思路 ══

  const handleWatchDesign = () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(transitionTimerRef.current);
    setSelectedNodeId(null);
    setHasVisitedFlow(true);
    setPhase("design");
  };

  // ══ 回到首页 ══

  const handleBackToPoem = () => {
    if (phase === "poem") return;
    cancelAnimationFrame(rafRef.current);
    clearTimeout(transitionTimerRef.current);
    setSelectedNodeId(null);
    setPhase("poem");
  };

  // ══ 节点点击 ══

  const handleNodeClick = (nodeId: number) => {
    setSelectedNodeId((prev) => {
      if (prev === nodeId) {
        // 取消选中 → 恢复自动轮播，立即跳到下一颗星
        manualRef.current = false;
        return (nodeId + 1) % STARS.length;
      } else {
        // 手动选中 → 暂停轮播
        manualRef.current = true;
        return nodeId;
      }
    });
  };

  const selectedStar = selectedNodeId !== null
    ? STARS.find((s) => s.id === selectedNodeId) ?? null
    : null;

  // ══ 星座自动播放 RAF ══

  useEffect(() => {
    if (phase !== "flow") return;

    // 动画一开始就默认选中第一颗星，底下立刻出文字
    setSelectedNodeId(0);

    const DURATION = 6000;
    flowStartRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - flowStartRef.current;
      const raw = Math.min(1, elapsed / DURATION);
      const t = 1 - Math.pow(1 - raw, 3); // easeOut cubic — 开头快结尾慢，无死区
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

  // ══ 完成态自动轮播 ══

  const isFlowComplete = flowProgress >= 1;

  useEffect(() => {
    if (phase !== "flow" || !isFlowComplete) {
      clearInterval(carouselRef.current);
      return;
    }

    // 首次完成：自动选中第一颗星
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
  }, [phase, isFlowComplete]); // selectedNodeId 故意不列入 deps，interval 内用 functional updater

  // ══════════════════════════════════════════════
  //  Render
  // ══════════════════════════════════════════════

  return (
    <section className="hero" id="graph">
      {/* ── 首页 + 按钮 ── */}
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
                  我的优势
                </button>
                <span className="hero-actions-sep" aria-hidden="true" />
                <button
                  className="btn-primary"
                  onClick={handleWatchDesign}
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

// ═════════════════════════════════════════════════════════
//  NodeDetail — 融入深空的透明文字，不遮挡星座
// ═════════════════════════════════════════════════════════

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

// ═════════════════════════════════════════════════════════
//  FloatingNav — 右下角导航
//  首页页 ↓（→观看执行流）  执行流/设计思路页 ↑（→首页）
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
