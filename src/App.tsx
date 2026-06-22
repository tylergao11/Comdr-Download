import { useState } from 'react';
import { siteConfig } from './site-config';
import { GraphCanvas } from './components/GraphCanvas';
import { FramePlayer } from './components/FramePlayer';

export function App() {
  return (
    <>
      <Nav />
      <div className="site">
        <Hero />
        <Capabilities />
        <Hypergraph />
        <AiEditor />
        <Install />
        <McpConfig />
        <Footer />
      </div>
    </>
  );
}

// ── Nav ─────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="nav-bar">
      <div className="nav-inner">
        <span className="nav-logo">Comdr</span>
        <div className="nav-links">
          <a href="#hypergraph">超图</a>
          <a href="#ai-editor">AI 编辑器</a>
          <a href="#install">安装</a>
        </div>
        <a className="nav-cta" href="#install">安装</a>
      </div>
    </nav>
  );
}

// ── Hero ────────────────────────────────────────────────────

function Hero() {
  const { tagline, description, phase, links } = siteConfig;

  return (
    <section className="hero">
      {phase !== 'stable' && (
        <span className="phase-badge" data-phase={phase}>
          {phase.toUpperCase()}
        </span>
      )}
      <h1 className="hero-tagline">{tagline}</h1>
      <p className="hero-desc">{description}</p>

      <div className="hero-actions">
        <a className="btn-primary" href="#install">
          开始安装
        </a>
        <a className="btn-ghost" href="#hypergraph">
          查看能力
        </a>
      </div>

      <div className="hero-trust">
        <a href={links.github} target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub
        </a>
        <span className="trust-sep">·</span>
        <span>MCP</span>
        <span className="trust-sep">·</span>
        <span>Cocos Creator</span>
      </div>
    </section>
  );
}

// ── Capabilities — Bento Grid ────────────────────────────────

function Capabilities() {
  return (
    <section className="capabilities-section">
      <div className="section-head">
        <h2>两大核心能力</h2>
        <p className="section-sub">
          理解项目，操作项目。可视化贯穿始终。
        </p>
      </div>

      <div className="bento">
        {siteConfig.capabilities.map((cap) => (
          <div key={cap.title} className="bento-card">
            <span className="bento-icon">{cap.icon}</span>
            <h3>{cap.title}</h3>
            <p className="bento-summary">{cap.summary}</p>
            <ul className="bento-bullets">
              {cap.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Hypergraph ──────────────────────────────────────────────

function Hypergraph() {
  return (
    <section className="hypergraph-section" id="hypergraph">
      <div className="section-head">
        <h2>超图 — 完整的项目理解</h2>
        <p className="section-sub">
          不仅是增强检索，而是真正的语义连线。从方法调用追溯到每一个受影响的 Prefab 和资源。
        </p>
      </div>

      <GraphCanvas />

      {/* 图例 — 纯 CSS 类，无 inline style */}
      <div className="legend">
        <div className="legend-group">
          <span className="legend-label">节点</span>
          <div className="legend-items">
            <span className="legend-item"><i className="legend-dot lgd-doc" />文档</span>
            <span className="legend-item"><i className="legend-dot lgd-scr" />脚本</span>
            <span className="legend-item"><i className="legend-dot lgd-node" />节点</span>
            <span className="legend-item"><i className="legend-dot lgd-meth" />方法</span>
            <span className="legend-item"><i className="legend-dot lgd-ast" />资源</span>
          </div>
        </div>
        <div className="legend-group">
          <span className="legend-label">边</span>
          <div className="legend-items">
            <span className="legend-item"><i className="legend-line lge-calls" />调用</span>
            <span className="legend-item"><i className="legend-line lge-triggers" />事件</span>
            <span className="legend-item"><i className="legend-line lge-refs" />引用</span>
            <span className="legend-item"><i className="legend-line lge-imports" />导入</span>
            <span className="legend-item"><i className="legend-line lge-belong" />归属</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── AI Editor ────────────────────────────────────────────────

function AiEditor() {
  return (
    <section className="ai-editor-section" id="ai-editor">
      <div className="section-head">
        <h2>AI 编辑器 — 描述即所得</h2>
        <p className="section-sub">
          从意图到执行，Coding Agent 与 Comdr 协同完成整个开发链路。
        </p>
      </div>

      <FramePlayer />
    </section>
  );
}

// ── Install ──────────────────────────────────────────────────

function Install() {
  const steps = siteConfig.installSteps;
  const [copiedIdx, setCopiedIdx] = useState(-1);

  const handleCopy = (step: typeof steps[0], i: number) => {
    const text = step.ready ? step.readyText : step.fallbackText;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(-1), 1800);
  };

  return (
    <section className="install" id="install">
      <div className="section-head">
        <h2>安装</h2>
        <p className="section-sub">
          四步，除 Bridge 需重启 Creator 外其余立即可用。
        </p>
      </div>
      <div className="install-steps">
        {steps.map((step, i) => (
          <div key={i} className="install-step">
            <button
              className={`step-copy-btn ${copiedIdx === i ? 'copied' : ''}`}
              onClick={() => handleCopy(step, i)}
            >
              {copiedIdx === i ? '已复制' : '复制'}
            </button>
            <div className="install-step-head">
              <span className="step-num">{i + 1}</span>
              <div className="install-step-title">
                <h3>{step.label}</h3>
                {step.note && <span className="step-note">{step.note}</span>}
              </div>
            </div>
            {step.ready ? (
              <pre className="code-block"><code>{step.readyText}</code></pre>
            ) : (
              <div className="step-pending-block">
                <span className="pending-label">Alpha — 当前走源码</span>
                <pre className="code-block"><code>{step.fallbackText}</code></pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── MCP Config ───────────────────────────────────────────────

function McpConfig() {
  const { mcpClients } = siteConfig;

  return (
    <section className="mcp-config" id="mcp-config">
      <div className="section-head">
        <h2>MCP 配置</h2>
        <p className="section-sub">
          一份配置，适用所有 MCP 兼容的 AI 客户端。
        </p>
      </div>

      <div className="mcp-snippet">
        <pre className="code-block"><code>{mcpClients[0].configSnippet}</code></pre>
      </div>

      <div className="mcp-tags">
        {mcpClients.map((c) => (
          <span key={c.id} className="mcp-tag">
            {c.name}
            {c.docUrl && (
              <a href={c.docUrl} target="_blank" rel="noopener">文档 →</a>
            )}
          </span>
        ))}
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────

function Footer() {
  const { links } = siteConfig;

  return (
    <footer className="footer">
      <div className="footer-links">
        <a href={links.github} target="_blank" rel="noopener">GitHub</a>
        <a href={links.docsRepo} target="_blank" rel="noopener">Documentation</a>
      </div>
      <span>Comdr · {siteConfig.phase}</span>
    </footer>
  );
}
