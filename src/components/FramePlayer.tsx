import { useCallback, useEffect, useMemo, useState } from "react";

type FlowKind = "request" | "graph" | "compile" | "write" | "audit";

interface FrameNode {
  label: string;
  kind: FlowKind;
}

interface FrameLink {
  from: number;
  to: number;
  kind: string;
}

interface Frame {
  title: string;
  eyebrow: string;
  summary: string;
  lines: string[];
  nodes: FrameNode[];
  links: FrameLink[];
}

const SLOTS = [
  { x: 50, y: 13 },
  { x: 18, y: 34 },
  { x: 82, y: 35 },
  { x: 28, y: 76 },
  { x: 72, y: 76 },
];

const FRAMES: Frame[] = [
  {
    title: "需求输入",
    eyebrow: "01 / request",
    summary: "用户给出游戏开发目标，Comdr 建立可执行意图。",
    lines: [
      "> user: 创建 Boss 入场、血条和弹幕阶段",
      "intent.parse -> gameplay.workflow",
      "scope.pin -> scene: Level_01",
      "guard.enable -> snapshot before write",
    ],
    nodes: [
      { label: "User", kind: "request" },
      { label: "Intent", kind: "request" },
      { label: "Level_01", kind: "graph" },
      { label: "Snapshot", kind: "audit" },
      { label: "Plan", kind: "compile" },
    ],
    links: [
      { from: 0, to: 1, kind: "parse" },
      { from: 1, to: 2, kind: "pin" },
      { from: 1, to: 4, kind: "plan" },
      { from: 4, to: 3, kind: "guard" },
    ],
  },
  {
    title: "星图检索",
    eyebrow: "02 / retrieve",
    summary: "从项目星图里拉取脚本、节点、资源和方法调用关系。",
    lines: [
      "comdr.retrieve(\"Level_01\", \"BossCtrl\", \"boss_sheet\")",
      "[graph] 11 nodes / 15 relations highlighted",
      "[asset] boss_sheet.png -> BossCtrl.sprite",
      "[call] GameManager.spawnWave -> BossCtrl.enter",
    ],
    nodes: [
      { label: "Level_01", kind: "graph" },
      { label: "GameManager", kind: "graph" },
      { label: "BossCtrl", kind: "write" },
      { label: "spawnWave", kind: "compile" },
      { label: "boss_sheet", kind: "audit" },
    ],
    links: [
      { from: 1, to: 0, kind: "belongsTo" },
      { from: 2, to: 0, kind: "belongsTo" },
      { from: 1, to: 3, kind: "calls" },
      { from: 2, to: 4, kind: "refs" },
      { from: 3, to: 2, kind: "triggers" },
    ],
  },
  {
    title: "编译计划",
    eyebrow: "03 / compile",
    summary: "把自然语言拆成 DSL，生成可审计、可回滚的操作序列。",
    lines: [
      "compile -> add-node Boss_Entrance",
      "compile -> attach cc.ProgressBar",
      "compile -> bind animation: boss_enter",
      "compile -> route event: phase.changed",
    ],
    nodes: [
      { label: "DSL", kind: "compile" },
      { label: "Boss_Entrance", kind: "write" },
      { label: "ProgressBar", kind: "write" },
      { label: "Animation", kind: "graph" },
      { label: "Event", kind: "audit" },
    ],
    links: [
      { from: 0, to: 1, kind: "add-node" },
      { from: 0, to: 2, kind: "attach" },
      { from: 0, to: 3, kind: "bind" },
      { from: 3, to: 4, kind: "route" },
    ],
  },
  {
    title: "写入编辑器",
    eyebrow: "04 / write",
    summary: "通过 Bridge 写入 Cocos Creator，并持续记录每一步影响面。",
    lines: [
      "write -> create node /Canvas/BossLayer/Boss",
      "write -> bind SpriteFrame boss_sheet.png",
      "write -> set ProgressBar.totalLength = 280",
      "[ok] editor transaction committed",
    ],
    nodes: [
      { label: "Bridge", kind: "write" },
      { label: "Canvas", kind: "graph" },
      { label: "Boss", kind: "write" },
      { label: "SpriteFrame", kind: "audit" },
      { label: "Transaction", kind: "compile" },
    ],
    links: [
      { from: 0, to: 1, kind: "open" },
      { from: 1, to: 2, kind: "create" },
      { from: 2, to: 3, kind: "bind" },
      { from: 0, to: 4, kind: "commit" },
      { from: 4, to: 2, kind: "verify" },
    ],
  },
  {
    title: "审计完成",
    eyebrow: "05 / audit",
    summary: "生成快照和事件时间线，失败可回滚，成功可追踪。",
    lines: [
      "[ok] snapshot saved, rollback available",
      "[ok] 7 editor writes verified",
      "[trace] Level_01 impact surface updated",
      "handoff -> ready for designer review",
    ],
    nodes: [
      { label: "Snapshot", kind: "audit" },
      { label: "Trace", kind: "graph" },
      { label: "Audit", kind: "audit" },
      { label: "Rollback", kind: "write" },
      { label: "Review", kind: "request" },
    ],
    links: [
      { from: 0, to: 2, kind: "verify" },
      { from: 1, to: 2, kind: "trace" },
      { from: 2, to: 3, kind: "fallback" },
      { from: 2, to: 4, kind: "handoff" },
    ],
  },
];

const FRAME_INTERVAL = 4300;

const FALLBACK_SLOT = { x: 50, y: 50 };

function linkPath(link: FrameLink) {
  const from = SLOTS[link.from] ?? FALLBACK_SLOT;
  const to = SLOTS[link.to] ?? FALLBACK_SLOT;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const bend = link.from % 2 === 0 ? -8 : 8;
  return `M ${from.x} ${from.y} Q ${mx + bend} ${my - bend} ${to.x} ${to.y}`;
}

export function FramePlayer() {
  const [frameIndex, setFrameIndex] = useState(0);
  const [lineCursor, setLineCursor] = useState(0);
  const [paused, setPaused] = useState(false);

  const frame = FRAMES[frameIndex];
  const displayedLines = useMemo(
    () => FRAMES[frameIndex].lines.slice(0, lineCursor),
    [frameIndex, lineCursor],
  );
  const typingDone = lineCursor >= frame.lines.length;

  useEffect(() => {
    setLineCursor(0);
  }, [frameIndex]);

  useEffect(() => {
    if (typingDone) return;
    const delay = frame.lines[lineCursor]?.startsWith("[") ? 180 : 260;
    const timer = setTimeout(() => {
      setLineCursor(value => Math.min(value + 1, frame.lines.length));
    }, delay);
    return () => clearTimeout(timer);
  }, [frame.lines, lineCursor, typingDone]);

  useEffect(() => {
    if (!typingDone || paused) return;
    const timer = setTimeout(() => {
      setFrameIndex(value => (value + 1) % FRAMES.length);
    }, FRAME_INTERVAL);
    return () => clearTimeout(timer);
  }, [typingDone, paused]);

  const goTo = useCallback((index: number) => {
    setFrameIndex(index);
    setPaused(true);
  }, []);

  return (
    <div className="frame-player">
      <div className="frame-window">
        <div className="frame-titlebar">
          <span className="frame-dots"><i /><i /><i /></span>
          <span className="frame-title">Comdr Session</span>
          <span className="frame-badge">{frame.eyebrow}</span>
        </div>

        <div className="frame-body">
          <div className="frame-graph" aria-label="Comdr execution hypergraph">
            <svg className="frame-graph-links" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <filter id="flowGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="1.35" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {frame.links.map((link, index) => (
                <g key={`${frame.title}-${link.kind}-${index}`}>
                  <path className="frame-graph-link-glow" d={linkPath(link)} />
                  <path className="frame-graph-link" d={linkPath(link)} />
                  <text className="frame-graph-label">
                    <textPath href={`#frame-link-${frameIndex}-${index}`} startOffset="50%">{link.kind}</textPath>
                  </text>
                  <path id={`frame-link-${frameIndex}-${index}`} d={linkPath(link)} fill="none" />
                </g>
              ))}
            </svg>
            <i className="frame-graph-core" />
            <span className="frame-graph-core-label">Comdr</span>
            {frame.nodes.map((node, index) => {
              const slot = SLOTS[index];
              if (!slot) return null;
              return (
                <span
                  key={`${node.label}-${index}`}
                  className={`frame-graph-node frame-graph-node--${node.kind}`}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    animationDelay: `${index * -0.72}s`,
                  }}
                >
                  {node.label}
                </span>
              );
            })}
            <span className="frame-graph-spark frame-graph-spark--one" />
            <span className="frame-graph-spark frame-graph-spark--two" />
            <span className="frame-graph-spark frame-graph-spark--three" />
          </div>

          <div className="frame-copy">
            <span>{frame.title}</span>
            <h3>{frame.summary}</h3>
          </div>

          <div className="frame-terminal" aria-label="Comdr execution log">
            {displayedLines.map((line, index) => (
              <div
                key={`${frame.title}-${index}-${line}`}
                className={`frame-line ${line.startsWith("[ok]") ? "line-ok" : line.startsWith("[") ? "line-note" : line.startsWith(">") ? "line-cmd" : ""}`}
              >
                {line}
              </div>
            ))}
            {!typingDone && <span className="frame-cursor" />}
          </div>
        </div>
      </div>

      <div className="frame-dots-row" aria-label="执行流步骤">
        {FRAMES.map((item, index) => (
          <button
            key={item.title}
            className={`frame-dot ${index === frameIndex ? "active" : ""}`}
            onClick={() => goTo(index)}
            title={item.title}
          >
            <span className="dot-indicator" />
            <span className="dot-label">{item.title}</span>
          </button>
        ))}
        {paused && (
          <button className="frame-resume" onClick={() => setPaused(false)}>
            继续自动播放
          </button>
        )}
      </div>
    </div>
  );
}
