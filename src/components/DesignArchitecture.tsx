import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/* ═════════════════════════════════════════════════════════
   DesignArchitecture — 深空信号站 · 故事化架构叙事
   垂直流水线 + 信号脉冲 + 悬停叙事切换
   与星座执行流完全不同的视觉语言
   ═════════════════════════════════════════════════════════ */

// ── 信号站数据 ──

interface SignalStation {
  id: string;
  label: string;
  subtitle: string;
  x: number;
  y: number;
  r: number; // 核心半径
  ringCount: number; // 频率环层数
}

const STATIONS: SignalStation[] = [
  { id: "cli", label: "CLI", subtitle: "MCP 入口", x: 50, y: 10, r: 4.0, ringCount: 1 },
  { id: "engine", label: "Engine", subtitle: "核心引擎", x: 50, y: 30, r: 5.2, ringCount: 3 },
  { id: "hypergraph", label: "Hypergraph", subtitle: "项目星图", x: 24, y: 56, r: 3.8, ringCount: 2 },
  { id: "bridge", label: "Bridge", subtitle: "编辑器扩展", x: 76, y: 56, r: 3.8, ringCount: 2 },
  { id: "foundation", label: "Foundation", subtitle: "共享基础", x: 50, y: 78, r: 3.4, ringCount: 1 },
  { id: "view", label: "View", subtitle: "桌面应用", x: 50, y: 92, r: 3.0, ringCount: 1 },
];

const STATION_MAP = new Map<string, SignalStation>();
for (const s of STATIONS) STATION_MAP.set(s.id, s);

// ── 传输线路 ──

interface TransmissionLine {
  from: string;
  to: string;
}

const LINES: TransmissionLine[] = [
  { from: "cli", to: "engine" },
  { from: "engine", to: "hypergraph" },
  { from: "engine", to: "bridge" },
  { from: "hypergraph", to: "foundation" },
  { from: "bridge", to: "foundation" },
  { from: "foundation", to: "view" },
];

// ── 故事叙事 ──

const DEFAULT_NARRATIVE = "一个意图从深空坠落，穿越六道信号站，最终抵达编辑器里的一行精确操作。";

const NODE_NARRATIVES: Record<string, string> = {
  cli:
    "「MCP 入口」——它不挑来客。Claude、Codex、任意 LLM 只需一句自然语言，剩下的交给 Comdr。标准协议，零绑定。",
  engine:
    "「核心引擎」——Commander 将意图编译为 DSL 指令，Gateway 以五阶段管线编排执行。熔断器在暗处沉默守护，连环错误自动熔断。",
  hypergraph:
    "「项目星图」——全量扫描磁盘，七种边类型编织节点、Prefab、脚本与资源的引用之网。你问「谁引用了这个 Prefab」，它早已知道答案。",
  bridge:
    "「编辑器扩展」——在 Cocos Creator 进程内沉默运行。原子写入不留半成品，快照回滚随时可退。每一次操作，全链路可追溯。",
  foundation:
    "「共享基础」——全系统唯一真相源。类型、常量、组件目录、AST 解析，所有包的类型契约在此定义，从一而终。",
  view:
    "「桌面应用」——Tauri + React + PixiJS 构筑的独立窗口。实时注视 Agent 的每一次心跳：引用网络、事件时间线、LLM 输出与缓存命缺。",
};

// ── 设计信条（侧边注释） ──

const CREDOS = [
  { text: "职责分离", x: 6, y: 40 },
  { text: "快照替换", x: 82, y: 40 },
  { text: "磁盘检索", x: 6, y: 68 },
  { text: "原子写入", x: 82, y: 68 },
];

// ── 工具 ──

function linePath(x1: number, y1: number, x2: number, y2: number) {
  // 垂直或接近垂直用直线，斜向用轻微弯曲
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) < 2) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const bend = dx * 0.18;
  return `M ${x1} ${y1} C ${x1} ${my - bend * 0.3}, ${x2} ${my + bend * 0.3}, ${x2} ${y2}`;
}

// ═════════════════════════════════════════════════════════
//  组件
// ═════════════════════════════════════════════════════════

export function DesignArchitecture() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [lockedId, setLockedId] = useState<string | null>(null);

  const activeId = lockedId ?? hoveredId;
  const narrative = activeId ? NODE_NARRATIVES[activeId] : DEFAULT_NARRATIVE;

  const handleClick = (id: string) => {
    setLockedId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {/* ── 叙事文本 ── */}
      <div className="design-narrative">
        <AnimatePresence mode="wait">
          <motion.p
            key={activeId ?? "__default__"}
            className="design-narrative-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: activeId ? 0.85 : 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {narrative}
          </motion.p>
        </AnimatePresence>
        <motion.p
          className="design-narrative-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          悬停探索架构 · 点击锁定叙述
        </motion.p>
      </div>

      {/* ── 信号站 SVG ── */}
      <div className="design-visual">
        <svg
          className="design-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* 中心光束渐变 */}
            <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(200,215,235,0.06)" />
              <stop offset="15%" stopColor="rgba(200,215,235,0.18)" />
              <stop offset="50%" stopColor="rgba(220,230,245,0.28)" />
              <stop offset="85%" stopColor="rgba(200,215,235,0.18)" />
              <stop offset="100%" stopColor="rgba(200,215,235,0.06)" />
            </linearGradient>

            {/* 信号站辉光 */}
            <radialGradient id="sigCore" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="18%" stopColor="#e8ecf4" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#bcc4d8" stopOpacity="0.25" />
              <stop offset="80%" stopColor="rgba(200,215,235,0.04)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="rgba(200,215,235,0)" stopOpacity="0" />
            </radialGradient>

            {/* 大站辉光 (Engine) */}
            <radialGradient id="sigCoreLarge" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="12%" stopColor="#f0f2f8" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#c8d0e4" stopOpacity="0.4" />
              <stop offset="65%" stopColor="rgba(200,215,235,0.08)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="rgba(200,215,235,0)" stopOpacity="0" />
            </radialGradient>

            {/* 脉冲粒子辉光 */}
            <radialGradient id="pulseGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#e0e4f0" stopOpacity="0.4" />
              <stop offset="100%" stopColor="rgba(200,215,235,0)" stopOpacity="0" />
            </radialGradient>

            {/* 连线柔光 */}
            <filter id="sigEdgeGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="0.7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ══ 中心主光束 ══ */}
          <rect
            x="49.3" y="8" width="1.4" height="84"
            fill="url(#beamGrad)"
            opacity="0.7"
            style={{
              animation: "beam-shimmer 4s ease-in-out infinite",
            }}
          />

          {/* ══ 传输线路 ══ */}
          <g opacity="0.3">
            {LINES.map((line, i) => {
              const from = STATION_MAP.get(line.from)!;
              const to = STATION_MAP.get(line.to)!;
              const d = linePath(from.x, from.y, to.x, to.y);
              const isActive =
                activeId === line.from || activeId === line.to;

              return (
                <g key={`sig-line-${i}`}>
                  {/* 光晕 */}
                  <path
                    d={d}
                    fill="none"
                    stroke={isActive ? "rgba(210,225,245,0.18)" : "rgba(200,215,235,0.05)"}
                    strokeWidth={isActive ? 5 : 3}
                    strokeLinecap="round"
                    filter="url(#sigEdgeGlow)"
                    style={{ transition: "stroke 0.5s ease, stroke-width 0.5s ease" }}
                  />
                  {/* 主线 */}
                  <path
                    d={d}
                    fill="none"
                    stroke={isActive ? "rgba(220,235,250,0.4)" : "rgba(190,205,225,0.16)"}
                    strokeWidth={isActive ? 0.8 : 0.4}
                    strokeLinecap="round"
                    strokeDasharray={isActive ? "2 4" : "1 6"}
                    style={{ transition: "stroke 0.5s ease, stroke-width 0.5s ease" }}
                  />
                </g>
              );
            })}
          </g>

          {/* ══ 信号脉冲粒子 ══ */}
          <g opacity="0.45">
            {LINES.map((line, i) => {
              const from = STATION_MAP.get(line.from)!;
              const to = STATION_MAP.get(line.to)!;
              const d = linePath(from.x, from.y, to.x, to.y);
              return (
                <g key={`sig-pulse-${i}`}>
                  <circle r="1.8" fill="url(#pulseGlow)">
                    <animateMotion
                      dur={`${2.4 + i * 0.3}s`}
                      repeatCount="indefinite"
                      begin={`${i * 0.5}s`}
                      path={d}
                    />
                    <animate
                      attributeName="opacity"
                      values="0.9;0.25;0.9"
                      dur={`${1.6 + i * 0.2}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="0.8" fill="rgba(200,215,235,0.3)">
                    <animateMotion
                      dur={`${2.4 + i * 0.3}s`}
                      repeatCount="indefinite"
                      begin={`${i * 0.5 + 0.25}s`}
                      path={d}
                    />
                  </circle>
                </g>
              );
            })}
          </g>

          {/* ══ 信号站节点 ══ */}
          {STATIONS.map((station) => {
            const isEngine = station.id === "engine";
            const isActive = activeId === station.id;
            const isLocked = lockedId === station.id;
            const coreR = isActive ? station.r * 1.2 : station.r;

            return (
              <g
                key={`sig-station-${station.id}`}
                className="design-node"
                onMouseEnter={() => setHoveredId(station.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleClick(station.id)}
              >
                {/* 不可见点击区 */}
                <circle
                  cx={station.x}
                  cy={station.y}
                  r={14}
                  fill="transparent"
                  className="design-hit"
                />

                {/* 频率环 — 从内到外 */}
                {Array.from({ length: station.ringCount }).map((_, ri) => {
                  const ringR = coreR + 2 + ri * 3.5;
                  return (
                    <circle
                      key={`ring-${ri}`}
                      cx={station.x}
                      cy={station.y}
                      r={ringR}
                      fill="none"
                      stroke="rgba(200,215,235,0.12)"
                      strokeWidth="0.35"
                      strokeDasharray={ri === 0 ? "0.6 2.4" : "0.3 3.5"}
                      opacity={isActive ? 0.8 : 0.4}
                      style={{
                        pointerEvents: "none",
                        transition: "opacity 0.4s ease",
                        transformBox: "fill-box",
                        transformOrigin: "center",
                        animation:
                          isActive || isLocked
                            ? `ring-spin ${6 + ri * 2}s linear infinite`
                            : `ring-spin ${10 + ri * 4}s linear infinite`,
                      }}
                    />
                  );
                })}

                {/* 外层柔光 */}
                <circle
                  cx={station.x}
                  cy={station.y}
                  r={isEngine ? 12 : (isActive ? 9 : 7)}
                  fill="url(#sigCoreLarge)"
                  opacity={isActive ? 0.7 : 0.35}
                  style={{
                    pointerEvents: "none",
                    transition: "opacity 0.4s ease, r 0.4s ease",
                  }}
                />

                {/* 中层辉光 */}
                <circle
                  cx={station.x}
                  cy={station.y}
                  r={isEngine ? 6 : 4}
                  fill={isEngine ? "url(#sigCoreLarge)" : "url(#sigCore)"}
                  opacity={isActive ? 0.9 : 0.6}
                  className="design-star-core"
                  style={{
                    pointerEvents: "none",
                    transition: "opacity 0.4s ease",
                    animation: `station-breathe ${2.5 + station.ringCount}s ${station.id.length * 0.4}s ease-in-out infinite`,
                  }}
                />

                {/* 亮白核心 */}
                <circle
                  cx={station.x}
                  cy={station.y}
                  r={isEngine ? 1.6 : (coreR * 0.2)}
                  fill="#ffffff"
                  opacity={isActive ? 1 : 0.75}
                  style={{
                    pointerEvents: "none",
                    transition: "opacity 0.3s ease, r 0.3s ease",
                  }}
                />

                {/* 锁定指示 */}
                {isLocked && (
                  <circle
                    cx={station.x}
                    cy={station.y}
                    r={coreR + 3}
                    fill="none"
                    stroke="rgba(220,235,245,0.35)"
                    strokeWidth="0.5"
                    style={{ pointerEvents: "none" }}
                  />
                )}

                {/* 标签 */}
                <text
                  x={station.x}
                  y={station.y + (station.ringCount > 1 ? 17 : 14)}
                  textAnchor="middle"
                  fill={isActive ? "rgba(210,220,235,0.75)" : "rgba(160,170,190,0.45)"}
                  fontFamily="var(--font-mono, monospace)"
                  fontSize="2.6"
                  letterSpacing="0.05em"
                  style={{
                    pointerEvents: "none",
                    transition: "fill 0.4s ease",
                  }}
                >
                  {station.label}
                </text>
                {/* 副标签 */}
                <text
                  x={station.x}
                  y={station.y + (station.ringCount > 1 ? 20.5 : 17.5)}
                  textAnchor="middle"
                  fill={isActive ? "rgba(180,190,210,0.45)" : "rgba(140,150,170,0.25)"}
                  fontFamily="var(--font-sans, sans-serif)"
                  fontSize="1.7"
                  letterSpacing="0.03em"
                  style={{
                    pointerEvents: "none",
                    transition: "fill 0.4s ease",
                  }}
                >
                  {station.subtitle}
                </text>
              </g>
            );
          })}

          {/* ══ 设计信条 — 侧边注释 ══ */}
          {CREDOS.map((credo, i) => (
            <text
              key={`credo-${i}`}
              x={credo.x}
              y={credo.y}
              textAnchor={credo.x < 50 ? "start" : "end"}
              fill="rgba(180,190,210,0.22)"
              fontFamily="var(--font-serif, serif)"
              fontSize="2.4"
              letterSpacing="0.06em"
              style={{ pointerEvents: "none" }}
            >
              {credo.text}
            </text>
          ))}

          {/* ══ 中心 Comdr 标记 ══ */}
          <text
            x="50"
            y="98.5"
            textAnchor="middle"
            fill="rgba(255,255,255,0.55)"
            fontFamily="var(--font-mono, monospace)"
            fontSize="2.8"
            fontWeight="600"
            opacity="0.6"
            style={{ pointerEvents: "none" }}
          >
            Comdr
          </text>
        </svg>
      </div>

      {/* 品牌签 */}
      <p className="design-brand">
        Comdr · 更懂游戏开发的AI编辑器
      </p>
    </>
  );
}
