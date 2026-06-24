import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { siteConfig } from "./site-config";
import { FramePlayer } from "./components/FramePlayer";
import { HeroStarfield } from "./components/HeroStarfield";

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-12% 0px" },
  transition: { duration: 0.7, ease: "easeOut" as const },
};

function Reveal({ children }: { children: ReactNode }) {
  return <motion.div {...reveal}>{children}</motion.div>;
}

export function App() {
  return (
    <>
      <Nav />
      <main className="site">
        <Hero />
        <Reveal><CapabilityBand /></Reveal>
        <Reveal><ScenarioPills /></Reveal>
        <Reveal><DevFlowSection /></Reveal>
        <Reveal><SafetySection /></Reveal>
        <Reveal><InstallSection /></Reveal>
        <Footer />
      </main>
    </>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className="nav-bar">
      <a className="brand" href="#" onClick={close}>
        <img src="/comdr-icon.svg" alt="" />
        <span>Comdr</span>
      </a>
      <div className={`nav-links ${open ? "nav-links--open" : ""}`}>
        <a href="#graph" onClick={close}>星图</a>
        <a href="#workflow" onClick={close}>执行流</a>
        <a href="#install" onClick={close}>安装</a>
        <a href={siteConfig.links.github} target="_blank" rel="noreferrer">GitHub</a>
        <a className="nav-cta-mobile" href="#install" onClick={close}>开始接入</a>
      </div>
      <a className="nav-cta" href="#install">开始接入</a>
      <button className="nav-toggle" onClick={() => setOpen(value => !value)} aria-label="菜单">
        <span /><span /><span />
      </button>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero" id="graph">
      <HeroStarfield />
      <div className="hero-copy">
        <span className="phase-chip">{siteConfig.phase.toUpperCase()}</span>
        <h1>{siteConfig.tagline}</h1>
        <p>{siteConfig.description}</p>
        <div className="hero-actions">
          <a className="btn-primary" href="#install">配置 MCP</a>
          <a className="btn-secondary" href="#workflow">观看执行流</a>
        </div>
      </div>
    </section>
  );
}

function CapabilityBand() {
  return (
    <section className="capability-band-section">
      <div className="section-copy">
        <span className="section-kicker">Capabilities</span>
        <h2>三层能力，把 Cocos 项目变成 AI 可操作的对象</h2>
      </div>
      <div className="capability-band">
        {siteConfig.capabilities.map(capability => (
          <article className="capability-card" key={capability.title}>
            <h2>{capability.title}</h2>
            <p>{capability.summary}</p>
            <div className="tag-cloud">
              {capability.bullets.map(bullet => <span key={bullet}>{bullet}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScenarioPills() {
  return (
    <div className="scenario-pills">
      <span className="scenario-pills__label">全自动开发工作流</span>
      <div className="scenario-pills__row">
        <span>自然语言输入，Cocos 编辑器中即时落地</span>
        <span>星图自动检索上下文，补齐组件依赖</span>
        <span>每一步快照可回滚，全链路可审计</span>
      </div>
    </div>
  );
}

function DevFlowSection() {
  return (
    <section className="dev-flow-section" id="workflow">
      <div className="section-copy">
        <span className="section-kicker">Execution Flow</span>
        <h2>把需求推进成可审计的编辑器操作</h2>
        <p>
          检索上下文、编译 DSL、写入 Cocos、记录快照。它像一条穿过星河的执行轨迹。
        </p>
      </div>
      <FramePlayer />
    </section>
  );
}

function SafetySection() {
  return (
    <section className="safety-section">
      <div className="section-copy">
        <span className="section-kicker">Safety &amp; Observability</span>
        <h2>每一次写入都可追踪、可回滚</h2>
      </div>
      <div className="safety-grid">
        {[
          {
            title: "写入前快照",
            desc: "Bridge 发起写操作前自动记录场景状态。出问题一键回滚到上一个干净态，不留残留节点。",
            icon: "◉",
          },
          {
            title: "影响面高亮",
            desc: "星图实时标记被改动波及的节点、脚本和调用链。改了一个 Prefab，哪些脚本会受影响一目了然。",
            icon: "◎",
          },
          {
            title: "事件时间线",
            desc: "每次 DSL 编译、写入、回滚、审计都记为带时间戳的事件。可回放任意一段操作历史。",
            icon: "◷",
          },
          {
            title: "多端接入",
            desc: "同一套 MCP 命令，Claude、Cursor、VS Code 都能用。Comdr View 作为桌面面板统一监控所有客户端的操作。",
            icon: "⎔",
          },
        ].map(item => (
          <article className="safety-card" key={item.title}>
            <span className="safety-card__icon">{item.icon}</span>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function InstallSection() {
  const [copied, setCopied] = useState(false);

  const prompt = `安装 Comdr：
1. npm install && npm run build
2. 安装 Bridge 扩展，指定我的 Cocos 项目路径
3. 配好 MCP 客户端，指向 server.js`;

  const copy = () => {
    navigator.clipboard.writeText(prompt).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="install-section" id="install">
      <div className="section-copy">
        <span className="section-kicker">Install</span>
        <h2>接入指令</h2>
      </div>

      <div className="install-prompt-card">
        <pre><code>{prompt}</code></pre>
        <button onClick={copy}>
          {copied ? "已复制" : "复制"}
        </button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <span>Comdr · 更懂游戏开发的AI编辑器</span>
      <div>
        <a href={siteConfig.links.github} target="_blank" rel="noreferrer">GitHub</a>
        <a href={siteConfig.links.docsRepo} target="_blank" rel="noreferrer">Docs</a>
      </div>
    </footer>
  );
}
