export type ReleasePhase = "alpha" | "beta" | "stable";

export interface SiteConfig {
  phase: ReleasePhase;
  tagline: string;
  description: string;
}

export const siteConfig: SiteConfig = {
  phase: "alpha",
  tagline: "星图",
  description:
    "它像一条穿过星河的执行轨迹,融入你的AI工作流",
};
