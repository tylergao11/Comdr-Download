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
        <Reveal><AdvantageBand /></Reveal>

        <Reveal><DevFlowSection /></Reveal>
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
        <img src={`${import.meta.env.BASE_URL}comdr-icon.svg`} alt="" />
        <span>Comdr</span>
      </a>
      <div className={`nav-links ${open ? "nav-links--open" : ""}`}>
        <a href="#graph" onClick={close}>星图</a>
        <a href="#workflow" onClick={close}>执行流</a>
        <a href="#install" onClick={close}>安装</a>
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
          <a className="btn-secondary" href="#install">配置 MCP</a>
          <a className="btn-primary" href="#workflow">观看执行流</a>
        </div>
      </div>
      <button
        className="scroll-indicator"
        aria-label="向下滚动"
        onClick={() => {
          window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
        }}
      >
        <span className="scroll-chevron" />
      </button>
    </section>
  );
}

function CapabilityBand() {
  return (
    <section className="capability-band-section" id="capabilities">
      <div className="section-copy">
        <span className="section-kicker">Capabilities</span>
        <h2>两大核心能力</h2>
      </div>
      <div className="capability-band">
        {siteConfig.capabilities.map((capability, i) => (
          <article className="capability-card" key={capability.title}>
            <span className="capability-num">{String(i + 1).padStart(2, "0")}</span>
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

function AdvantageBand() {
  return (
    <section className="advantage-band-section">
      <div className="advantage-band">
        {siteConfig.advantages.map(a => (
          <div className="advantage-item" key={a.keyword}>
            <span className="advantage-keyword">{a.keyword}</span>
            <span className="advantage-desc">{a.description}</span>
          </div>
        ))}
      </div>
    </section>
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

function InstallSection() {
  const [copied, setCopied] = useState(false);

  const prompt = `帮我安装 Comdr：
1. npm install -g comdr
2. 从最新 Release 下载 Bridge 扩展，装到 Cocos 项目
3. 在 MCP 客户端里加上 comdr server`;

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
    </footer>
  );
}
