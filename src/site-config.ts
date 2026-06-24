export type ReleasePhase = "alpha" | "beta" | "stable";

export interface Capability {
  title: string;
  summary: string;
  bullets: string[];
}

export interface SiteConfig {
  phase: ReleasePhase;
  tagline: string;
  description: string;
  capabilities: Capability[];
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
};
