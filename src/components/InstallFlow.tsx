import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Tab = "view" | "bridge" | "mcp";

const VERSION = __APP_VERSION__;
const VIEW_SETUP_FILE = `comdr-view-setup-v${VERSION}.exe`;
const BRIDGE_FILE = `comdr-bridge-v${VERSION}.zip`;

const AI_PROMPT = [
  "请按新的 Comdr View 工作区流程安装 Comdr：",
  "",
  `1. 下载并运行 Comdr View 安装包：download/${VIEW_SETUP_FILE}`,
  "",
  "2. 打开 Comdr View，在启动页选择 Cocos Creator 项目根目录作为工作区。",
  "",
  "3. 在 Comdr View 内点击安装/更新 Bridge，把 Bridge 同步到当前工作区。",
  "",
  "4. 完全关闭并重新打开 Cocos Creator，然后回到 Comdr View 进入星图。",
  "",
  "可选 MCP：npm install -g @tylergao11/comdr。comdr-run 默认读取 Comdr View 当前工作区；projectPath 只用于校验是否一致，不能切换工作区。",
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
        {localCopied ? "已复制给 AI" : "复制给 AI 的安装说明"}
      </button>
    </div>
  );
}

const TAB_DESC: Record<Tab, string> = {
  view: "Comdr View 是新的唯一入口：选择工作区、同步 Bridge、查看星图和驱动 MCP 都从这里开始。",
  bridge: "Bridge 不再由下载页或 CLI 单独分发到项目根目录，优先通过 Comdr View 安装到当前工作区。",
  mcp: "CLI/MCP 只负责外部 AI 接入；comdr-run 默认读取 Comdr View 当前工作区，显式项目路径只做一致性校验。",
};

const TABS: { key: Tab; label: string; desc: string }[] = [
  { key: "view", label: "Comdr View", desc: "先选工作区" },
  { key: "bridge", label: "Bridge", desc: "View 内同步" },
  { key: "mcp", label: "MCP", desc: "可选高级" },
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
  const [tab, setTab] = useState<Tab>("view");
  const cooldownRef = useRef(false);

  const handleClose = () => setVisible(false);
  const handleNav = (fn: () => void) => {
    setVisible(false);
    fn();
  };

  useEffect(() => {
    // 滚动/滑动触发浮层
    const onWheel = () => {
      if (cooldownRef.current) return;
      cooldownRef.current = true;
      setVisible((v) => !v);
      setTimeout(() => { cooldownRef.current = false; }, 600);
    };

    // touchmove：加位移阈值，避免 tap 关闭按钮时微小手抖误触发
    let touchStartY = 0;
    const TOUCH_THRESHOLD = 14; // px，小于此距离视为 tap，不触发

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (cooldownRef.current) return;
      const dy = Math.abs((e.touches[0]?.clientY ?? 0) - touchStartY);
      if (dy < TOUCH_THRESHOLD) return;
      cooldownRef.current = true;
      setVisible((v) => !v);
      setTimeout(() => { cooldownRef.current = false; }, 600);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
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
            <button className="install-close" onClick={handleClose} type="button" aria-label="关闭" />
            <p className="install-kicker">开始使用</p>

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

            <AnimatePresence mode="wait">
              {tab === "view" && (
                <motion.div
                  key="view"
                  className="install-panel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <a className="install-dl-btn" href={`download/${VIEW_SETUP_FILE}`} download>
                    下载 Comdr View v{VERSION}
                  </a>
                  <div className="install-steps">
                    <div className="install-step">
                      <span className="install-step-num">1</span>
                      <span>运行安装包并打开 Comdr View</span>
                    </div>
                    <div className="install-step">
                      <span className="install-step-num">2</span>
                      <span>在启动页选择 Cocos Creator 项目根目录</span>
                    </div>
                    <div className="install-step">
                      <span className="install-step-num">3</span>
                      <span>在 View 内安装/更新 Bridge，再重启 Cocos Creator</span>
                    </div>
                  </div>
                  <InstallPrompt />
                </motion.div>
              )}

              {tab === "bridge" && (
                <motion.div
                  key="bridge"
                  className="install-panel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="install-steps">
                    <div className="install-step">
                      <span className="install-step-num">1</span>
                      <span>先在 Comdr View 选择工作区</span>
                    </div>
                    <div className="install-step">
                      <span className="install-step-num">2</span>
                      <span>点击安装/更新 Bridge，同步到 <code>extensions/comdr-cocos-bridge/</code></span>
                    </div>
                    <div className="install-step">
                      <span className="install-step-num">3</span>
                      <span>独立 Bridge 包：<a href={`download/${BRIDGE_FILE}`} download>{BRIDGE_FILE}</a></span>
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === "mcp" && (
                <motion.div
                  key="mcp"
                  className="install-panel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="install-steps">
                    <div className="install-step">
                      <span className="install-step-num">1</span>
                      <span>需要外部 AI 接入时安装 <code>npm install -g @tylergao11/comdr</code></span>
                    </div>
                    <div className="install-step">
                      <span className="install-step-num">2</span>
                      <span>MCP 使用 <code>comdr</code> 启动，<code>comdr-run</code> 自动读取 View 当前工作区</span>
                    </div>
                    <div className="install-step">
                      <span className="install-step-num">3</span>
                      <span>projectPath 只做一致性校验；切换项目请回到 Comdr View 选择工作区</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

            <div className="install-nav">
              {phase !== "poem" && (
                <button className="install-nav-btn" onClick={() => handleNav(onBackToPoem)}>
                  首页
                </button>
              )}
              {phase !== "flow" && (
                <button className="install-nav-btn" onClick={() => handleNav(onWatchFlow)}>
                  优势
                </button>
              )}
              {phase !== "design" && (
                <button className="install-nav-btn" onClick={() => handleNav(onWatchDesign)}>
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
