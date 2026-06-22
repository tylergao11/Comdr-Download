// ============================================================
// FramePlayer — Commander 执行过程帧动画回放
// 终端风格，逐行打字 · 手动翻页暂停 · 手动恢复自动播放
// v2: 打字减速 · 永久暂停 · dot 加大发光 · 色值分离
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';

interface Frame { title: string; lines: string[] }

const FRAMES: Frame[] = [
  {
    title: '需求',
    lines: [
      '用户提出需求：',
      '',
      '> 我想做一款竖屏射击游戏，',
      '> 玩家控制战机，躲避敌机弹幕，',
      '> 击杀 Boss 过关',
      '',
      'Coding Agent 分析需求，拆解为具体任务。',
      'Comdr 作为执行层，接收每条指令，',
      '在编辑器中精准完成。',
    ],
  },
  {
    title: '拆解',
    lines: [
      'Coding Agent 拆解出 5 项任务：',
      '',
      '  ① 创建 Player 战机 Prefab',
      '     └─ 挂载碰撞体 + 武器脚本',
      '  ② 创建 Enemy 敌机 Prefab',
      '     └─ 含血条 UI + 掉落逻辑',
      '  ③ 创建 Bullet 预制体 ×2',
      '     └─ 玩家子弹 / 敌人子弹',
      '  ④ 搭建关卡场景 Level_01',
      '     └─ 背景层 + 生成点 + Boss',
      '  ⑤ 接入 GameManager 脚本',
      '',
      '逐条进入 Comdr 执行。',
    ],
  },
  {
    title: 'Comdr 执行 ①',
    lines: [
      '执行 ①：创建 Player 战机',
      '',
      'Commander 检索超图——',
      '  >retrieve(probe=document-serialize)',
      '    ← 当前场景结构，直连超图无 grep',
      '  >retrieve(schemas=cc.RigidBody2D,',
      '      cc.BoxCollider2D, cc.Sprite)',
      '    ← 组件属性，知识库自动补充',
      '',
      '生成 DSL → compile → write',
      '[ok] Player.prefab 创建完成',
    ],
  },
  {
    title: 'Comdr 执行 ②③④',
    lines: [
      '执行 ②：Enemy.prefab',
      '  >compile → >comp cc.ProgressBar',
      '  → >write',
      '  [ok]',
      '',
      '执行 ③：Bullet_Player + Bullet_Enemy',
      '  >compile ×2 → 设置速度/伤害属性',
      '  → >write',
      '  [ok] [ok]',
      '',
      '执行 ④：Level_01.scene',
      '  >compile → 布置背景/生成点/Boss',
      '  → >write',
      '  [ok] 关卡搭建完成',
    ],
  },
  {
    title: '完成',
    lines: [
      '执行 ⑤：接入 GameManager',
      '  >add-comp → 绑定 Player/Bullet 引用',
      '  → >done',
      '',
      '全部 5 项任务执行完毕：',
      '  Player.prefab  ✓',
      '  Enemy.prefab   ✓',
      '  Bullet ×2      ✓',
      '  Level_01.scene ✓',
      '  GameManager    ✓',
      '',
      'Coding Agent 汇总结果，进入下一轮。',
      '🎯 4 轮 · 17 条命令 · 零错误',
    ],
  },
];

const FRAME_INTERVAL = 5000; // ms — 给用户足够阅读时间

export function FramePlayer() {
  const [frameIdx, setFrameIdx] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [lineCursor, setLineCursor] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 逐行打字 — 80~160ms，空行 40ms
  useEffect(() => {
    const frame = FRAMES[frameIdx];
    if (lineCursor >= frame.lines.length) return;
    const delay = frame.lines[lineCursor] === '' ? 40 : 80 + Math.random() * 80;
    const t = setTimeout(() => {
      setDisplayedLines(prev => [...prev, frame.lines[lineCursor]]);
      setLineCursor(prev => prev + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [frameIdx, lineCursor]);

  // 帧切换重置
  useEffect(() => {
    setDisplayedLines([]);
    setLineCursor(0);
  }, [frameIdx]);

  // 自动轮播（暂停时停止）
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setFrameIdx(prev => (prev + 1) % FRAMES.length);
    }, FRAME_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused]);

  // 手动翻页 → 永久暂停
  const goTo = useCallback((i: number) => {
    setFrameIdx(i);
    setPaused(true);
  }, []);

  const resume = useCallback(() => setPaused(false), []);

  const frame = FRAMES[frameIdx];

  return (
    <div className="frame-player">
      <div className="frame-window">
        <div className="frame-titlebar">
          <span className="frame-dots"><i /><i /><i /></span>
          <span className="frame-title">Comdr · Commander Session</span>
          <span className="frame-badge">{frame.title}</span>
        </div>
        <div className="frame-body">
          {displayedLines.map((line, i) => (
            <div key={i} className={`frame-line ${
              line.startsWith('[ok]') ? 'line-ok'
              : line.startsWith('[err]') ? 'line-err'
              : line.startsWith('>') ? 'line-cmd'
              : line.startsWith('  ├') || line.startsWith('  └') || line.startsWith('...') ? 'line-tree'
              : line.startsWith('  >') ? 'line-subcmd'
              : line.startsWith('🎯') ? 'line-done'
              : ''}`}>
              {line || ' '}
            </div>
          ))}
          {lineCursor < frame.lines.length && (
            <span className="frame-cursor">▊</span>
          )}
        </div>
      </div>

      <div className="frame-dots-row">
        {FRAMES.map((f, i) => (
          <button key={i}
            className={`frame-dot ${i === frameIdx ? 'active' : ''}`}
            onClick={() => goTo(i)} title={f.title}>
            <span className="dot-indicator" />
            <span className="dot-label">{f.title}</span>
          </button>
        ))}
        {paused && (
          <button className="frame-resume" onClick={resume}>
            ▶ 自动播放
          </button>
        )}
      </div>
    </div>
  );
}
