import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/* ═════════════════════════════════════════════════════════
   ConstellationGraph — 深空星座执行流 SVG
   星空主题：银白光点、径向渐变辉光、星尘微粒、星光轨迹
   ═════════════════════════════════════════════════════════ */

// ── 数据 ──

export interface StarNode {
  id: number;
  label: string;
  description: string;
  finalX: number;
  finalY: number;
  scatterX: number;
  scatterY: number;
}

interface ConstellationEdge {
  from: number;
  to: number;
}

const STAR_MAP = new Map<number, StarNode>();

export const STARS: StarNode[] = [
  { id: 0, label: "意图", description: "用自然语言描述你想做的事——新增技能、重构系统、跨文件查找引用。Comdr 理解你的意图，拆解为可执行的步骤。", finalX: 50, finalY: 14, scatterX: 38, scatterY: 24 },
  { id: 1, label: "星图", description: "Comdr 把 Cocos Creator 项目解析成可搜索、可追踪的星图。节点、Prefab、脚本、资源之间的真实关系一目了然。", finalX: 14, finalY: 44, scatterX: 82, scatterY: 18 },
  { id: 2, label: "编译", description: "意图被编译成精确的编辑器操作序列——创建节点、修改属性、调整引用。每一步都可预览、可撤销。", finalX: 86, finalY: 44, scatterX: 16, scatterY: 72 },
  { id: 3, label: "写入", description: "确认后的操作批量写入项目文件。支持 dry-run 预演，改动范围透明可控。", finalX: 28, finalY: 82, scatterX: 72, scatterY: 80 },
  { id: 4, label: "审计", description: "每次修改留下完整审计轨迹。谁改了什么、为什么改、影响范围——全链路可追溯、可回滚。", finalX: 72, finalY: 82, scatterX: 26, scatterY: 52 },
];

// 初始化快速查找 Map
for (const star of STARS) STAR_MAP.set(star.id, star);

const EDGES: ConstellationEdge[] = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 4 },
];

const ACTS = [
  "星光横渡。每一颗星，都是一个等待唤醒的意图。",
  "引力开始作用——意图 → 星图 → 编译 → 写入 → 审计，五颗星连成一线。",
  "它完成了。它刚刚开始。",
];

// ── 工具 ──

function edgePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const bend = (Math.abs(dx) > Math.abs(dy) ? dx : -dy) * 0.16;
  return `M ${x1} ${y1} Q ${mx + bend} ${my - bend} ${x2} ${y2}`;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeOut(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function getStarPosition(star: StarNode, progress: number) {
  let t: number;
  if (progress <= 0.33) {
    t = easeOut(Math.min(1, progress / 0.33)) * 0.6;
  } else if (progress <= 0.66) {
    t = 0.6 + easeOut((progress - 0.33) / 0.33) * 0.4;
  } else {
    t = 1;
  }
  return {
    x: lerp(star.scatterX, star.finalX, t),
    y: lerp(star.scatterY, star.finalY, t),
  };
}

// ── Props ──

interface ConstellationGraphProps {
  progress: number;    // eased cubic，驱动视觉（星星位置、连线）
  actProgress: number; // 线性 0→1，驱动文案均匀切换
  onNodeClick: (nodeId: number) => void;
  selectedNodeId: number | null;
}

// ═════════════════════════════════════════════════════════
//  组件
// ═════════════════════════════════════════════════════════

export function ConstellationGraph({
  progress,
  actProgress,
  onNodeClick,
  selectedNodeId,
}: ConstellationGraphProps) {
  const p = Math.max(0, Math.min(1, progress));
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const isComplete = p >= 1;

  // ── 派生值 ──

  const actRaw = Math.max(0, Math.min(1, actProgress));
  const actStep = actRaw * 3;
  const actIndex = Math.min(2, Math.max(0, Math.floor(actStep)));
  const currentAct = ACTS[actIndex] ?? ACTS[0];

  const starOpacity =
    p <= 0.33
      ? 0.2 + (p / 0.33) * 0.4
      : p <= 0.66
        ? 0.6 + ((p - 0.33) / 0.33) * 0.3
        : 0.9;

  const edgeOpacity =
    p < 0.33 ? 0 : p < 0.5 ? ((p - 0.33) / 0.17) * 0.4 : 0.4;

  const particlesVisible = p >= 0.55;
  const centerGlowOpacity = 0.06 + p * 0.25;
  const edgeDashProgress = Math.max(0, Math.min(1, (p - 0.33) / 0.17));

  return (
    <>
      {/* 叙事文案 */}
      <div className="constellation-text">
        <AnimatePresence mode="wait">
          <motion.p
            key={actIndex}
            className="constellation-act"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.78 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {currentAct}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* SVG 星座 */}
      <div className="constellation-visual">
        <svg
          className="constellation-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* 星点辉光 — 中心亮白 → 向外渐隐 */}
            <radialGradient id="starGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="12%" stopColor="#f0f2f8" stopOpacity="0.85" />
              <stop offset="30%" stopColor="#d0d6e4" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#8890a8" stopOpacity="0.06" />
              <stop offset="100%" stopColor="rgba(200,215,235,0)" stopOpacity="0" />
            </radialGradient>

            {/* 外层柔光 — 大范围微弱扩散 */}
            <radialGradient id="starOuter" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#d0d8e8" stopOpacity="0.12" />
              <stop offset="40%" stopColor="rgba(200,215,235,0.04)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="rgba(200,215,235,0)" stopOpacity="0" />
            </radialGradient>

            {/* 粒子辉光 */}
            <radialGradient id="particleGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#e0e4f0" stopOpacity="0.5" />
              <stop offset="70%" stopColor="rgba(200,215,235,0.1)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="rgba(200,215,235,0)" stopOpacity="0" />
            </radialGradient>

            {/* 连线柔光滤镜 */}
            <filter id="edgeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.0" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* 中心星云辉光 */}
            <radialGradient id="centerNebula" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="20%" stopColor="#d0d8e8" stopOpacity="0.35" />
              <stop offset="50%" stopColor="rgba(200,215,235,0.08)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="rgba(200,215,235,0)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ══ 中心星云辉光 — 大范围柔光 ══ */}
          <circle
            cx="50" cy="50" r="24"
            fill="url(#centerNebula)"
            opacity={centerGlowOpacity}
          />

          {/* ══ 中心呼吸环 ══ */}
          {[0, 1, 2].map((i) => (
            <circle
              key={`ring-${i}`}
              cx="50" cy="50" r="6"
              fill="none"
              stroke="rgba(200,215,235,0.15)"
              strokeWidth="0.6"
              style={{
                animation: `pulse-ring 3s ${i * 1}s ease-out infinite`,
                transformOrigin: "50% 50%",
              }}
            />
          ))}

          {/* ══ 全部内容组 — 完成态微动 ══ */}
          <g className={isComplete ? "constellation-drift" : ""}>

          {/* ══ 连线 — 星光轨迹 ══ */}
          <g opacity={edgeOpacity}>
            {EDGES.map((edge, i) => {
              const fromStar = STAR_MAP.get(edge.from)!;
              const toStar = STAR_MAP.get(edge.to)!;
              const fromPos = getStarPosition(fromStar, p);
              const toPos = getStarPosition(toStar, p);
              const d = edgePath(fromPos.x, fromPos.y, toPos.x, toPos.y);
              const pathLen =
                Math.sqrt(
                  (fromPos.x - toPos.x) ** 2 + (fromPos.y - toPos.y) ** 2,
                ) * 1.1;

              const isPulse = hoveredId === edge.from || hoveredId === edge.to
                || selectedNodeId === edge.from || selectedNodeId === edge.to;

              return (
                <g key={`edge-${i}`}>
                  {/* 光晕底层 */}
                  <path
                    d={d} fill="none"
                    stroke={isPulse ? "rgba(200,215,235,0.08)" : "rgba(200,215,235,0.03)"}
                    strokeWidth={isPulse ? 7 : 5} strokeLinecap="round"
                    style={{ transition: "stroke 0.4s ease, stroke-width 0.4s ease" }}
                  />
                  {/* 星光点阵 */}
                  <path
                    d={d} fill="none"
                    stroke={isPulse ? "rgba(220,230,245,0.35)" : "rgba(200,215,235,0.18)"}
                    strokeWidth={isPulse ? 1.6 : 1.0} strokeLinecap="round"
                    strokeDasharray="0.3 9"
                    strokeDashoffset={-p * 20}
                    filter="url(#edgeGlow)"
                    style={{ transition: "stroke 0.4s ease, stroke-width 0.4s ease" }}
                  />
                  {/* 主光线 */}
                  <path
                    d={d} fill="none"
                    stroke={isPulse ? "rgba(230,240,250,0.5)" : "rgba(210,220,235,0.28)"}
                    strokeWidth={isPulse ? 0.8 : 0.5} strokeLinecap="round"
                    strokeDasharray={pathLen}
                    strokeDashoffset={pathLen * (1 - edgeDashProgress)}
                    style={{ transition: "stroke 0.4s ease, stroke-width 0.4s ease" }}
                  />
                </g>
              );
            })}
          </g>

          {/* ══ 星尘微粒 — 沿光路流动 ══ */}
          <g
            opacity={particlesVisible ? 1 : 0}
            style={{ transition: "opacity 0.8s ease" }}
          >
            {EDGES.map((edge, ei) => {
              const fromStar = STAR_MAP.get(edge.from)!;
              const toStar = STAR_MAP.get(edge.to)!;
              const fromPos = getStarPosition(fromStar, p);
              const toPos = getStarPosition(toStar, p);
              const d = edgePath(fromPos.x, fromPos.y, toPos.x, toPos.y);
              return [0, 1, 2].map((pi) => (
                <g key={`fp-${ei}-${pi}`}>
                  {/* 主星点 */}
                  <circle r="2.2" fill="url(#particleGlow)">
                    <animateMotion
                      dur={`${2.6 + pi * 0.7}s`}
                      repeatCount="indefinite"
                      begin={`${pi * 1.0}s`}
                      path={d}
                    />
                    <animate
                      attributeName="opacity"
                      values="0.9;0.4;0.9"
                      dur={`${1.8 + pi * 0.4}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* 尾迹点 — 稍暗跟随 */}
                  <circle r="0.9" fill="rgba(200,215,235,0.45)">
                    <animateMotion
                      dur={`${2.6 + pi * 0.7}s`}
                      repeatCount="indefinite"
                      begin={`${pi * 1.0 + 0.15}s`}
                      path={d}
                    />
                  </circle>
                  {/* 微尘 */}
                  <circle r="0.5" fill="rgba(200,215,235,0.2)">
                    <animateMotion
                      dur={`${2.6 + pi * 0.7}s`}
                      repeatCount="indefinite"
                      begin={`${pi * 1.0 + 0.3}s`}
                      path={d}
                    />
                  </circle>
                </g>
              ));
            })}
          </g>

          {/* ══ 星星节点 — 夜空星点 ══ */}
          {STARS.map((star) => {
            const pos = getStarPosition(star, p);
            const isFinal = p >= 0.66;
            const breatheDelay = star.id * 0.4;
            return (
              <g
                key={`star-${star.id}`}
                className="constellation-node"
                onClick={() => onNodeClick(star.id)}
                onMouseEnter={() => setHoveredId(star.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* 不可见点击区 */}
                <circle cx={pos.x} cy={pos.y} r={13} fill="transparent" className="constellation-hit" />

                {/* 外层柔光 */}
                <circle
                  cx={pos.x} cy={pos.y}
                  r={isFinal ? 11 : 8}
                  fill="url(#starOuter)"
                  opacity={starOpacity * 0.7}
                  style={{ pointerEvents: "none" }}
                />

                {/* 中层辉光 */}
                <circle
                  cx={pos.x} cy={pos.y}
                  r={isFinal ? 5.5 : 4}
                  fill="url(#starGlow)"
                  opacity={starOpacity}
                  className="constellation-star-core"
                  style={{
                    pointerEvents: "none",
                    animation: isFinal
                      ? `star-breathe 3s ${breatheDelay}s ease-in-out infinite`
                      : "none",
                  }}
                />

                {/* 亮白星核 */}
                <circle
                  cx={pos.x} cy={pos.y}
                  r={isFinal ? 1.4 : 1.0}
                  fill="#ffffff"
                  opacity={Math.min(1, starOpacity * 1.1)}
                  style={{ pointerEvents: "none" }}
                />

                {/* 标签 */}
                <text
                  x={pos.x} y={pos.y + (isFinal ? 16 : 14)}
                  textAnchor="middle"
                  fill="rgba(180,190,210,0.55)"
                  fontFamily="var(--font-mono, monospace)"
                  fontSize="2.8"
                  letterSpacing="0.03em"
                  opacity={starOpacity * 0.9}
                  style={{ pointerEvents: "none" }}
                >
                  {star.label}
                </text>
              </g>
            );
          })}

          {/* ══ 中心 Comdr 标签 ══ */}
          <text
            x="50" y="70"
            textAnchor="middle"
            fill="rgba(255,255,255,0.75)"
            fontFamily="var(--font-mono, monospace)"
            fontSize="3.2"
            fontWeight="600"
            opacity={0.4 + p * 0.5}
          >
            Comdr
          </text>

          </g>{/* constellation-drift */}
        </svg>
      </div>

      {/* 浮动品牌签 */}
      <p className="constellation-brand">
        Comdr · 更懂游戏开发的AI编辑器
      </p>
    </>
  );
}
