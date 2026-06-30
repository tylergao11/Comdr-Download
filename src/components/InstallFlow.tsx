import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Tab = "cli" | "bridge" | "view";

const VERSION = __APP_VERSION__;

const AI_PROMPT = [
  "请帮我安装 Comdr：",
  "",
  "1. npm install -g @tylergao11/comdr",
  "",
  "2. comdr install --project \"项目路径\"",
  "",
  "3. 重启 Cocos Creator。",
].join("\n");

function InstallPrompt() {
  const [localCopied, setLocalCopied] = useState(false);

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setLocalCopied(true);
      setTimeout(() => setLocalCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="install-ai-block">
      <button className="install-ai-copy" onClick={handle} type="button">
        {localCopied ? "✓ 已复制 — 粘贴给 AI 即可安装" : "点击复制 — 粘贴给 AI 一键安装"}
      </button>
    </div>
  );
}

const TAB_DESC: Record<Tab, string> = {
  cli: "安装 CLI 后运行 comdr install --project \"项目路径\"，自动下载 Bridge + View 并完成所有配置。",
  bridge: "comdr install 自动下载 Bridge 到项目的 extensions/ 目录。重启 Cocos Creator 后生效。",
  view: "comdr install 自动将 comdr-view.exe 放到项目根目录。",
};

const TABS: { key: Tab; label: string; desc: string }[] = [
  { key: "cli", label: "一键安装", desc: "comdr install" },
  { key: "bridge", label: "Bridge", desc: "自动安装到项目" },
  { key: "view", label: "View", desc: "项目内启动" },
];

export function InstallFlow({
  phase,
  onWatchFlow,
  onWatchDesign,
  onBackToPoem,
}: {
  phase: string;
  onWatchFlow: () => void;
  onWatchDesign: () => void;
  onBackToPoem: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState<Tab>("cli");
  const cooldownRef = useRef(false);

  const handleClose = () => setVisible(false);
  const handleNav = (fn: () => void) => { setVisible(false); fn(); };

  useEffect(() => {
    const toggle = () => {
      if (cooldownRef.current) return;
      cooldownRef.current = true;
      setVisible((v) => !v);
      setTimeout(() => { cooldownRef.current = false; }, 600);
    };
    window.addEventListener("wheel", toggle, { passive: true });
    window.addEventListener("touchmove", toggle, { passive: true });
    return () => {
      window.removeEventListener("wheel", toggle);
      window.removeEventListener("touchmove", toggle);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="install-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="install-overlay-inner"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <button className="install-close" onClick={handleClose} type="button" aria-label="关闭" />
            <p className="install-kicker">开始使用</p>

            <div className="install-tabs">
              {TABS.map((t) => (
                <button key={t.key} className={`install-tab ${tab === t.key ? "active" : ""}`}
                  onClick={() => setTab(t.key)} type="button">
                  <span className="install-tab-label">{t.label}</span>
                  <span className="install-tab-desc">{t.desc}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === "cli" && (
                <motion.div key="cli" className="install-panel"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                  <InstallPrompt />
                </motion.div>
              )}

              {tab === "bridge" && (
                <motion.div key="bridge" className="install-panel"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                  <div className="install-steps">
                    <div className="install-step"><span className="install-step-num">1</span>
                      <span>自动下载并解压到 <code>extensions/comdr-cocos-bridge/</code></span></div>
                    <div className="install-step"><span className="install-step-num">2</span>
                      <span>自动写入 <code>.mcp.json</code></span></div>
                    <div className="install-step"><span className="install-step-num">3</span>
                      <span>重启 Cocos Creator</span></div>
                  </div>
                </motion.div>
              )}

              {tab === "view" && (
                <motion.div key="view" className="install-panel"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                  <div className="install-steps">
                    <div className="install-step"><span className="install-step-num">1</span>
                      <span>自动放到项目根目录</span></div>
                    <div className="install-step"><span className="install-step-num">2</span>
                      <span>自动发现当前项目并读取星图缓存</span></div>
                    <div className="install-step"><span className="install-step-num">3</span>
                      <span>无需配置，开箱即用</span></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.p key={tab} className="install-footer"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {TAB_DESC[tab]}
              </motion.p>
            </AnimatePresence>

            <div className="install-nav">
              {phase !== "poem" && <button className="install-nav-btn" onClick={() => handleNav(onBackToPoem)}>首页</button>}
              {phase !== "flow" && <button className="install-nav-btn" onClick={() => handleNav(onWatchFlow)}>优势</button>}
              {phase !== "design" && <button className="install-nav-btn" onClick={() => handleNav(onWatchDesign)}>执行流</button>}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
