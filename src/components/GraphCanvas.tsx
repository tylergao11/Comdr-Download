import { useEffect, useMemo, useRef, useState } from "react";

type NodeKind = "document" | "script" | "node" | "method" | "asset";
type EdgeKind = "belongsTo" | "calls" | "triggers" | "refs" | "imports";

interface StarNode {
  id: string;
  kind: NodeKind;
  label: string;
  x: number;
  y: number;
  phase: number;
}

interface Link {
  from: string;
  to: string;
  kind: EdgeKind;
  bend: number;
}

interface MicroStar {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  hue: number;
}

export interface GraphSelection {
  kind: NodeKind;
  label: string;
  links: { kind: EdgeKind; label: string }[];
}

type InfoCardMode = "always" | "onSelect" | "hidden";

const NODES: StarNode[] = [
  { id: "d1", kind: "document", label: "Level_01", x: 0.50, y: 0.18, phase: 0.1 },
  { id: "s1", kind: "script", label: "GameManager", x: 0.50, y: 0.38, phase: 1.2 },
  { id: "s2", kind: "script", label: "PlayerCtrl", x: 0.22, y: 0.34, phase: 2.4 },
  { id: "s3", kind: "script", label: "EnemyAI", x: 0.78, y: 0.34, phase: 3.0 },
  { id: "m1", kind: "method", label: "spawnWave", x: 0.45, y: 0.57, phase: 0.8 },
  { id: "m2", kind: "method", label: "fireBullet", x: 0.22, y: 0.58, phase: 2.0 },
  { id: "m3", kind: "method", label: "onHit", x: 0.75, y: 0.58, phase: 4.2 },
  { id: "n1", kind: "node", label: "Player", x: 0.22, y: 0.76, phase: 5.0 },
  { id: "n2", kind: "node", label: "Boss", x: 0.72, y: 0.76, phase: 1.7 },
  { id: "a1", kind: "asset", label: "bullet.png", x: 0.37, y: 0.84, phase: 3.8 },
  { id: "a2", kind: "asset", label: "boss_sheet", x: 0.84, y: 0.82, phase: 2.9 },
];

const EDGES: Link[] = [
  { from: "s1", to: "d1", kind: "belongsTo", bend: -0.12 },
  { from: "s2", to: "d1", kind: "belongsTo", bend: 0.16 },
  { from: "s3", to: "d1", kind: "belongsTo", bend: -0.16 },
  { from: "m1", to: "s1", kind: "belongsTo", bend: 0.10 },
  { from: "m2", to: "s2", kind: "belongsTo", bend: -0.12 },
  { from: "m3", to: "s3", kind: "belongsTo", bend: 0.12 },
  { from: "m1", to: "m2", kind: "calls", bend: 0.20 },
  { from: "m1", to: "m3", kind: "calls", bend: -0.20 },
  { from: "m3", to: "m1", kind: "triggers", bend: 0.12 },
  { from: "m2", to: "n1", kind: "refs", bend: -0.14 },
  { from: "m3", to: "n2", kind: "refs", bend: 0.16 },
  { from: "m2", to: "a1", kind: "refs", bend: 0.08 },
  { from: "m3", to: "a2", kind: "refs", bend: -0.08 },
  { from: "s1", to: "s2", kind: "imports", bend: 0.10 },
  { from: "s1", to: "s3", kind: "imports", bend: -0.10 },
];

const NODE_COLOR: Record<NodeKind, string> = {
  document: "#FFE5B0",
  script: "#F4C86A",
  node: "#7DA7FF",
  method: "#B59CFF",
  asset: "#9AA8B8",
};

const NODE_SIZE: Record<NodeKind, number> = {
  document: 24,
  script: 18,
  node: 14,
  method: 10,
  asset: 8,
};

const EDGE_COLOR: Record<EdgeKind, string> = {
  belongsTo: "#687386",
  calls: "#F4C86A",
  triggers: "#F59E3D",
  refs: "#B59CFF",
  imports: "#52E0CF",
};

const EDGE_ALPHA: Record<EdgeKind, number> = {
  belongsTo: 0.18,
  calls: 0.52,
  triggers: 0.48,
  refs: 0.28,
  imports: 0.26,
};

function alpha(a: number) {
  return Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, "0");
}

function pointOnQuad(sx: number, sy: number, cx: number, cy: number, tx: number, ty: number, t: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * sx + 2 * mt * t * cx + t * t * tx,
    y: mt * mt * sy + 2 * mt * t * cy + t * t * ty,
  };
}

function createStars(count: number): MicroStar[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i * 97 + 31;
    return {
      x: ((seed * 17) % 1000) / 1000,
      y: ((seed * 29) % 1000) / 1000,
      r: 0.35 + ((seed * 7) % 10) / 10,
      phase: ((seed * 13) % 1000) / 1000 * Math.PI * 2,
      speed: 0.25 + ((seed * 19) % 100) / 180,
      hue: 208 + ((seed * 23) % 46),
    };
  });
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, boost: number) {
  const outer = ctx.createRadialGradient(x, y, 0, x, y, r * 4.2);
  outer.addColorStop(0, color + alpha(0.28 * boost));
  outer.addColorStop(0.42, color + alpha(0.10 * boost));
  outer.addColorStop(1, "transparent");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(x, y, r * 4.2, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, 0, x, y, r * 1.05);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.32, color + alpha(0.92));
  core.addColorStop(1, color + "00");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.05, 0, Math.PI * 2);
  ctx.fill();
}

export function GraphCanvas({
  compact = false,
  infoCardMode = compact ? "onSelect" : "always",
  highlight = "",
  onSelect,
}: {
  compact?: boolean;
  infoCardMode?: InfoCardMode;
  highlight?: string;
  onSelect?: (selection: GraphSelection) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<MicroStar[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const highlightLower = highlight.trim().toLowerCase();

  const highlightedIds = useMemo(() => {
    if (!highlightLower) return new Set<string>();
    return new Set(
      NODES.filter(n => n.label.toLowerCase().includes(highlightLower)).map(n => n.id),
    );
  }, [highlightLower]);

  const selectedNode = useMemo(
    () => NODES.find(node => node.id === selected) ?? null,
    [selected],
  );
  const selectedLinks = useMemo(() => {
    if (!selectedNode) return [];
    return EDGES
      .filter(edge => edge.from === selectedNode.id || edge.to === selectedNode.id)
      .map(edge => {
        const otherId = edge.from === selectedNode.id ? edge.to : edge.from;
        return {
          kind: edge.kind,
          label: NODES.find(node => node.id === otherId)?.label ?? otherId,
        };
      });
  }, [selectedNode]);

  useEffect(() => {
    starsRef.current = createStars(compact ? 96 : 150);
  }, [compact]);

  useEffect(() => {
    if (!selected || !selectedNode) return;
    onSelect?.({
      kind: selectedNode.kind,
      label: selectedNode.label,
      links: selectedLinks,
    });
  }, [onSelect, selected, selectedNode, selectedLinks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 720;
    let height = compact ? 300 : 430;
    let running = true;

    const resize = () => {
      width = wrap.clientWidth || 720;
      height = Math.round(width / (compact ? 2.35 : 1.68));
      wrap.style.setProperty("--graph-height", `${height}px`);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const render = (now: number) => {
      if (!running) return;
      const t = now / 1000;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createRadialGradient(width * 0.52, height * 0.42, 0, width * 0.52, height * 0.42, width * 0.72);
      bg.addColorStop(0, "#101b43");
      bg.addColorStop(0.46, "#070b22");
      bg.addColorStop(1, "#02040f");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const veil = ctx.createLinearGradient(0, height * 0.18, width, height * 0.84);
      veil.addColorStop(0, "rgba(0,0,0,0)");
      veil.addColorStop(0.45, "rgba(125,167,255,0.055)");
      veil.addColorStop(0.58, "rgba(244,200,106,0.030)");
      veil.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, width, height);

      for (const star of starsRef.current) {
        const twinkle = 0.55 + Math.sin(t * star.speed + star.phase) * 0.45;
        ctx.fillStyle = `hsla(${star.hue}, 28%, ${72 + twinkle * 18}%, ${0.12 + twinkle * 0.22})`;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Build active set: selected, hovered, or highlighted
      const hasHighlight = highlightedIds.size > 0;
      const activeIds = new Set<string>();
      if (hasHighlight) {
        highlightedIds.forEach(id => activeIds.add(id));
      }
      if (selected) activeIds.add(selected);
      EDGES.forEach(edge => {
        if (edge.from === selected || edge.to === selected || edge.from === hovered || edge.to === hovered) {
          activeIds.add(edge.from);
          activeIds.add(edge.to);
        }
      });

      for (let i = 0; i < EDGES.length; i++) {
        const edge = EDGES[i];
        const from = NODES.find(n => n.id === edge.from)!;
        const to = NODES.find(n => n.id === edge.to)!;
        const x1 = from.x * width, y1 = from.y * height;
        const x2 = to.x * width, y2 = to.y * height;
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const cx = (x1 + x2) * 0.5 + nx * edge.bend * width;
        const cy = (y1 + y2) * 0.5 + ny * edge.bend * width;
        const color = EDGE_COLOR[edge.kind];
        const edgeActive = activeIds.has(edge.from) && activeIds.has(edge.to);
        const edgeFaded = hasHighlight && !edgeActive;
        const edgeAlpha = edgeActive ? Math.min(0.82, EDGE_ALPHA[edge.kind] * 2.3) : EDGE_ALPHA[edge.kind];

        if (edgeFaded) {
          // Faded edge — barely visible
          ctx.strokeStyle = color + "14";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(cx, cy, x2, y2);
          ctx.stroke();
          continue;
        }

        if (edgeActive || edge.kind === "calls" || edge.kind === "triggers") {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = color + alpha(edgeActive ? 0.16 : 0.07);
          ctx.lineWidth = edgeActive ? 7 : 4;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(cx, cy, x2, y2);
          ctx.stroke();
          ctx.restore();
        }

        const rail = ctx.createLinearGradient(x1, y1, x2, y2);
        rail.addColorStop(0, "transparent");
        rail.addColorStop(0.24, color + alpha(edgeAlpha * 0.72));
        rail.addColorStop(0.52, color + alpha(edgeAlpha));
        rail.addColorStop(0.82, color + alpha(edgeAlpha * 0.72));
        rail.addColorStop(1, "transparent");
        ctx.strokeStyle = rail;
        ctx.lineWidth = edgeActive ? 1.8 : 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();

        if (edgeActive || edge.kind === "calls" || edge.kind === "triggers") {
          const count = edgeActive ? 3 : 1;
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          for (let p = 0; p < count; p++) {
            const pt = (t * (edge.kind === "triggers" ? 0.28 : 0.18) + i * 0.071 + p / count) % 1;
            const pos = pointOnQuad(x1, y1, cx, cy, x2, y2, pt);
            ctx.fillStyle = color + alpha(edgeActive ? 0.75 : 0.36);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, edgeActive ? 2.3 : 1.45, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      for (const node of NODES) {
        const x = node.x * width, y = node.y * height;
        const nodeActive = activeIds.has(node.id);
        const nodeHighlighted = highlightedIds.has(node.id);
        const nodeFaded = hasHighlight && !nodeHighlighted;
        const isSelected = selected === node.id;
        const color = NODE_COLOR[node.kind];
        const baseSize = NODE_SIZE[node.kind];
        const r = baseSize * (0.94 + Math.sin(t * 1.2 + node.phase) * 0.035) * (nodeActive ? 1.14 : 1);

        if (nodeFaded && !nodeActive) {
          ctx.globalAlpha = compact ? 0.18 : 0.22;
          drawStar(ctx, x, y, r * 0.7, color, 0.4);
          ctx.globalAlpha = 1;
          continue;
        }

        if (!nodeActive && selected && !hasHighlight) {
          ctx.globalAlpha = compact ? 0.46 : 0.58;
        }

        drawStar(ctx, x, y, r, color, nodeActive ? 1.6 : 0.92);

        // Selection glow ring — like FramePlayer's glowing node edges
        if (isSelected) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          const ringGlow = ctx.createRadialGradient(x, y, r * 1.1, x, y, r * 2);
          ringGlow.addColorStop(0, "transparent");
          ringGlow.addColorStop(0.4, color + "30");
          ringGlow.addColorStop(0.7, color + "10");
          ringGlow.addColorStop(1, "transparent");
          ctx.fillStyle = ringGlow;
          ctx.beginPath();
          ctx.arc(x, y, r * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Pulsing outer ring
          const pulse = 1 + Math.sin(t * 2.4 + node.phase) * 0.3;
          ctx.strokeStyle = color + alpha(0.42 * pulse);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(x, y, r * (1.6 + pulse * 0.5), 0, Math.PI * 2);
          ctx.stroke();
        }

        if (nodeHighlighted && !isSelected) {
          // Highlight ring for search matches
          ctx.strokeStyle = "#52E0CF60";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.globalAlpha = 1;

        if (nodeActive || hovered === node.id || nodeHighlighted || (!compact && node.kind !== "asset")) {
          ctx.fillStyle = nodeActive ? "rgba(255,255,255,0.92)" : "rgba(210,218,232,0.70)";
          ctx.font = `${nodeActive ? 12 : 10}px Inter, -apple-system, "Microsoft YaHei UI", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(node.label, x, y + r + 9);
        }
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
    return () => {
      running = false;
      ro.disconnect();
    };
  }, [compact, hovered, selected, highlightedIds]);

  const hit = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    for (let i = NODES.length - 1; i >= 0; i--) {
      const node = NODES[i];
      const nx = node.x * rect.width;
      const ny = node.y * rect.height;
      const r = NODE_SIZE[node.kind] * 1.8;
      if ((x - nx) ** 2 + (y - ny) ** 2 <= r * r) return node.id;
    }
    return null;
  };

  return (
    <div ref={wrapRef} className={`graph-canvas-wrap ${compact ? "graph-canvas-wrap--compact" : ""}`}>
      <canvas
        ref={canvasRef}
        className={`graph-canvas ${highlightLower ? "graph-canvas--filtering" : ""}`}
        onMouseMove={event => setHovered(hit(event.clientX, event.clientY))}
        onMouseLeave={() => setHovered(null)}
        onClick={event => {
          const node = hit(event.clientX, event.clientY);
          if (node) setSelected(prev => prev === node ? null : node);
        }}
      />
      {infoCardMode !== "hidden" && (infoCardMode === "always" || selected) && selectedNode && (
        <div className={`graph-info-card ${compact ? "graph-info-card--compact" : ""} ${selected ? "graph-info-card--visible" : ""}`}>
          <div className="graph-info-card__head">
            <span style={{ color: NODE_COLOR[selectedNode.kind] }}>{selectedNode.kind}</span>
            <strong>{selectedNode.label}</strong>
          </div>
          <div className="graph-info-card__links">
            {selectedLinks.slice(0, compact ? 3 : 5).map(link => (
              <div key={`${link.kind}-${link.label}`}>
                <i style={{ background: EDGE_COLOR[link.kind], boxShadow: `0 0 10px ${EDGE_COLOR[link.kind]}` }} />
                <span>{link.kind}</span>
                <strong>{link.label}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
