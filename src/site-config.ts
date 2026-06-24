// ============================================================
// site-config.ts — 下载页数据层
// ============================================================

export type ReleasePhase = 'alpha' | 'beta' | 'stable';

export interface McpClientConfig {
  name: string; id: string; configSnippet: string; docUrl?: string;
}

export interface InstallStep {
  label: string; readyText: string; fallbackText: string;
  ready: boolean; action: 'copy' | 'download';
  downloadUrl?: string; note?: string;
}

export interface Capability {
  icon: string; title: string; summary: string; bullets: string[];
}

export interface SiteConfig {
  phase: ReleasePhase;
  tagline: string; description: string;
  installSteps: InstallStep[];
  mcpClients: McpClientConfig[];
  capabilities: Capability[];
  architecture: { packages: { name: string; desc: string }[] };
  links: { github: string; docsRepo: string };
}

export const siteConfig: SiteConfig = {
  phase: 'alpha',

  tagline: '意念开发',
  description: ' AI 编辑器，融入游戏开发工作流',

  installSteps: [
    {
      label: '安装 CLI',
      readyText: 'npm install -g comdr',
      fallbackText: 'git clone https://github.com/ncuh/Comdr.git && cd Comdr && npm install && npm run build',
      ready: false, action: 'copy',
    },
    {
      label: '安装 View',
      readyText: '下载 comdr-view.exe',
      fallbackText: 'cd packages/overlay && npm install && npx tauri build',
      ready: false, action: 'download',
    },
    {
      label: '安装 Bridge',
      readyText: 'comdr install-bridge',
      fallbackText: 'npm run sync-bridge',
      ready: false, action: 'copy',
      note: 'Bridge 是 Cocos Creator 编辑器扩展。下次启动 Creator 时自动激活。一次安装，所有项目共用。',
    },
    {
      label: '配置 MCP',
      readyText: '复制下方 JSON 到 MCP 客户端配置',
      fallbackText: '见下方',
      ready: true, action: 'copy',
    },
  ],

  mcpClients: [
    {
      name: 'Claude Desktop', id: 'claude-desktop',
      configSnippet: `{
  "mcpServers": {
    "comdr": {
      "command": "node",
      "args": ["packages/cli/dist/server.js"]
    }
  }
}`,
      docUrl: 'https://docs.anthropic.com/en/docs/claude-code/mcp',
    },
    {
      name: 'Cursor', id: 'cursor',
      configSnippet: `{
  "mcpServers": {
    "comdr": {
      "command": "node",
      "args": ["packages/cli/dist/server.js"]
    }
  }
}`,
      docUrl: 'https://docs.cursor.com/context/model-context-protocol',
    },
    {
      name: 'VS Code', id: 'vscode',
      configSnippet: `{
  "mcpServers": {
    "comdr": {
      "command": "node",
      "args": ["packages/cli/dist/server.js"]
    }
  }
}`,
      docUrl: 'https://code.visualstudio.com/docs/copilot/chat/mcp-servers',
    },
  ],

  capabilities: [
    {
      icon: '🔗',
      title: '超图 — 真正的语义连线',
      summary:
        '构建项目的完整依赖图。从一行方法调用，追溯到它影响的每一个 Prefab、节点和资源。',
      bullets: [
        '6 种实体 × 7 种边类型，覆盖项目全部引用关系',
        '连边查图，毫秒级响应',
        '增量刷新，项目切换即时可用',
        '桌面端星图面板——所见即所得，点击节点展示完整关联链路',
      ],
    },
    {
      icon: '⚡',
      title: '自动化编辑 — 精确的操作执行',
      summary:
        '自然语言描述需求，Comdr 自动翻译为编辑器命令，精确操作节点、组件与资源。',
      bullets: [
        '自然语言 → 编辑器命令：Commander 引擎自动匹配组件与属性，无需手动查找 API',
        '写前自动快照，失败即回滚，每次写入保证项目不被破坏',
        '内置 200+ 引擎组件知识库，自动补全依赖与默认值，跟随版本',
        '桌面端事件时间线与 Token 仪表盘——执行过程完全透明',
      ],
    },
  ],

  architecture: {
    packages: [
      { name: 'foundation', desc: '共享类型、世界模型、常量、知识库——单一真相源' },
      { name: 'hypergraph', desc: '内存图数据库、7 阶段构建管线、查询原语' },
      { name: 'engine', desc: 'Commander LLM、DSL 解析与编排、5 阶段汇编管线' },
      { name: 'bridge', desc: 'Cocos Creator 编辑器扩展，文件 IPC，独立进程' },
      { name: 'cli', desc: 'MCP Server 入口——comdr-ask / comdr-view' },
      { name: 'overlay', desc: '桌面可视化面板——星图、事件时间线、Token 仪表盘' },
    ],
  },

  links: {
    github: 'https://github.com/ncuh/Comdr',
    docsRepo: 'https://github.com/ncuh/Comdr#readme',
  },
};
