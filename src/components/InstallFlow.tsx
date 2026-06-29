import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/* ═════════════════════════════════════════════════════════
   InstallFlow — 滚动触发的半透明浮层
   一次滚动手势 = 一次显隐切换，不限方向
   三标签页：CLI · Bridge · View
   ═════════════════════════════════════════════════════════ */

type Tab = "cli" | "bridge" | "view";

const VERSION = __APP_VERSION__;

const AI_PROMPT = `请帮我安装 Comdr（CLI+Bridge+View+MCP 全部搞定）：运行 npm install -g @tylergao11/comdr；Bridge：mkdir -p extensions && curl -L -o extensions/comdr-bridge.zip https://tylergao11.com/download/comdr-bridge-v${VERSION}.zip && unzip -o extensions/comdr-bridge.zip -d extensions/ && rm extensions/comdr-bridge.zip，然后重启 Cocos Creator；View：curl -L -o comdr-view.zip https://tylergao11.com/download/comdr-view-v${VERSION}.zip && unzip -o comdr-view.zip && rm comdr-view.zip；MCP 配置添加 {"mcpServers":{"comdr":{"command":"npx","args":["-y","@tylergao11/comdr"]}}}，重启 AI 客户端。`;

function InstallPrompt() {
  const [localCopied, setLocalCopied] = useState(false);

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setLocalCopied(true);
      setTimeout(() => setLocalCopied(false), 2000);
    } catch {
      // fallback
    }
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
  cli: "支持 Claude、Codex 及任意 MCP 兼容的 AI 客户端。",
  bridge: "Bridge 是 Comdr 与 Cocos Creator 之间的桥梁，负责接收 CLI 指令并在编辑器内执行节点操作。",
  view: "View 是 Comdr 的桌面可视化前端，通过星图实时展示项目结构、资源引用和 AI 执行轨迹。",
};

const TABS: { key: Tab; label: string; desc: string }[] = [
  { key: "cli", label: "AI", desc: "一键安装" },
  { key: "bridge", label: "Bridge", desc: "Cocos Creator 扩展" },
  { key: "view", label: "View", desc: "桌面星图" },
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
  const handleNav = (fn: () => void) => {
    setVisible(false);
    fn();
  };

  const isPoem = phase === "poem";
  const isFlow = phase === "flow";
  const isDesign = phase === "design";

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
          <div
            className="install-overlay-inner"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <button
              className="install-close"
              onClick={handleClose}
              type="button"
              aria-label="关闭"
            />
            <p className="install-kicker">开始使用</p>

            {/* ── 标签栏 ── */}
            <div className="install-tabs">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`install-tab ${tab === t.key ? "active" : ""}`}
                  onClick={() => setTab(t.key)}
                  type="button"
                >
                  <span className="install-tab-label">{t.label}</span>
                  <span className="install-tab-desc">{t.desc}</span>
                </button>
              ))}
            </div>

            {/* ── CLI 页 ── */}
            <AnimatePresence mode="wait">
              {tab === "cli" && (
                <motion.div
                  key="cli"
                  className="install-panel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <InstallPrompt />
                </motion.div>
              )}

              {/* ── Bridge 页 ── */}
              {tab === "bridge" && (
                <motion.div
                  key="bridge"
                  className="install-panel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <a
                    href={`/download/comdr-bridge-v${VERSION}.zip`}
                    className="install-dl-btn"
                  >
                    下载 Bridge v{VERSION}
                  </a>

                  <div className="install-steps">
                    <div className="install-step">
                      <span className="install-step-num">1</span>
                      <span>下载上方的 <code>comdr-bridge-v{VERSION}.zip</code></span>
                    </div>
                    <div className="install-step">
                      <span className="install-step-num">2</span>
                      <span>解压到 Cocos Creator 项目的 <code>extensions/</code> 目录</span>
                    </div>
                    <div className="install-step">
                      <span className="install-step-num">3</span>
                      <span>完全重启 Cocos Creator → 菜单栏出现 "Comdr"</span>
                    </div>
                  </div>

                </motion.div>
              )}

              {/* ── View 页 ── */}
              {tab === "view" && (
                <motion.div
                  key="view"
                  className="install-panel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <a
                    href={`/download/comdr-view-v${VERSION}.zip`}
                    className="install-dl-btn"
                  >
                    下载 View v{VERSION}
                  </a>

                  <div className="install-steps">
                    <div className="install-step">
                      <span className="install-step-num">1</span>
                      <span>下载上方的 <code>comdr-view-v{VERSION}.zip</code></span>
                    </div>
                    <div className="install-step">
                      <span className="install-step-num">2</span>
                      <span>解压，运行 <code>comdr-view.exe</code>（Windows）</span>
                    </div>
                    <div className="install-step">
                      <span className="install-step-num">3</span>
                      <span>View 自动连接 CLI → 实时展示星图与执行流</span>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

            {/* ── 底部描述 ── */}
            <AnimatePresence mode="wait">
              <motion.p
                key={tab}
                className="install-footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {TAB_DESC[tab]}
              </motion.p>
            </AnimatePresence>

            {/* ── 底部导航 ── */}
            <div className="install-nav">
              {!isPoem && (
                <button className="install-nav-btn" onClick={() => handleNav(onBackToPoem)} type="button">
                  首页
                </button>
              )}
              {!isFlow && (
                <button className="install-nav-btn" onClick={() => handleNav(onWatchFlow)} type="button">
                  优势
                </button>
              )}
              {!isDesign && (
                <button className="install-nav-btn" onClick={() => handleNav(onWatchDesign)} type="button">
                  执行流
                </button>
              )}
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
