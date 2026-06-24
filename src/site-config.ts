export type ReleasePhase = "alpha" | "beta" | "stable";

export interface InstallStep {
  label: string;
  description: string;
  command: string;
  ready: boolean;
}

export interface Capability {
  title: string;
  summary: string;
  bullets: string[];
}

export interface SiteConfig {
  phase: ReleasePhase;
  tagline: string;
  description: string;
  installSteps: InstallStep[];
  capabilities: Capability[];
  packages: { name: string; desc: string }[];
  links: { github: string; docsRepo: string };
}

export const siteConfig: SiteConfig = {
  phase: "alpha",
  tagline: "意念开发",
  description:
    "融入你的AI工作流",
  capabilities: [
    {
      title: "星图理解",
      summary: "从脚本、节点、资源到方法调用，建立真实的项目关系图。",
      bullets: ["搜索即定位", "关系链高亮", "增量同步", "影响面追踪"],
    },
    {
      title: "编辑器执行",
      summary: "把自然语言需求编译成可审计的 Cocos Creator 编辑器操作。",
      bullets: ["组件补全", "属性写入", "失败回滚", "事件时间线"],
    },
    {
      title: "AI 协作入口",
      summary: "通过 MCP 接入 Claude、Cursor、VS Code 等 AI 客户端。",
      bullets: ["统一命令", "项目上下文", "桌面可视化", "Token 仪表"],
    },
  ],
  installSteps: [
    {
      label: "构建项目",
      description: "安装依赖并构建，生成 MCP Server 入口。",
      command: "npm install && npm run build",
      ready: true,
    },
    {
      label: "安装 Cocos Bridge",
      description: "在 Cocos Creator 中安装 Bridge 扩展，连接编辑器。",
      command: "将 Bridge 扩展放入 Cocos Creator 的 extensions 目录",
      ready: true,
    },
    {
      label: "配置 MCP 客户端",
      description: "把 server.js 路径配入 AI 客户端，Bridge 连接后自动建星图。",
      command: `{
  "mcpServers": {
    "comdr": {
      "command": "node",
      "args": ["path/to/comdr/server.js"]
    }
  }
}`,
      ready: true,
    },
  ],
  packages: [
    { name: "foundation", desc: "共享类型、世界模型、知识库与项目事实。" },
    { name: "hypergraph", desc: "内存图数据库、查询与增量构建管线。" },
    { name: "engine", desc: "Commander、DSL 编译、执行编排与审计。" },
    { name: "bridge", desc: "Cocos Creator 编辑器扩展与 IPC 通道。" },
    { name: "cli", desc: "MCP Server、命令入口与本地工作流。" },
    { name: "view", desc: "桌面星图、事件时间线、Token 与反馈面板。" },
  ],
  links: {
    github: "https://github.com/tylergao11/Comdr",
    docsRepo: "https://github.com/tylergao11/Comdr#readme",
  },
};
