export type ReleasePhase = "alpha" | "beta" | "stable";

export interface Capability {
  title: string;
  summary: string;
  bullets: string[];
}

export interface Advantage {
  keyword: string;
  description: string;
}

export interface SiteConfig {
  phase: ReleasePhase;
  tagline: string;
  description: string;
  capabilities: Capability[];
  advantages: Advantage[];
}

export const siteConfig: SiteConfig = {
  phase: "alpha",
  tagline: "意念开发",
  description:
    "融入你的AI工作流",
  capabilities: [
    {
      title: "安全的编辑器写入能力",
      summary: "把自然语言需求编译成可审计的 Cocos Creator 编辑器操作。",
      bullets: ["组件补全", "属性写入", "快照回滚", "事件时间线"],
    },
    {
      title: "星图构建关系网络",
      summary: "从脚本、节点、资源到方法调用，建立真实的项目依赖图谱。",
      bullets: ["搜索即定位", "关系链高亮", "增量同步", "影响面追踪"],
    },
  ],
  advantages: [
    { keyword: "更省", description: "单次调用仅需思考模型 1/50 的成本" },
    { keyword: "更强", description: "掌握专属 Cocos 资料的大模型" },
    { keyword: "更准", description: "避免噪音，上下文更干净" },
  ],
};
