import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { execSync } from "child_process";
import { readFileSync } from "fs";

const VERSION = (() => {
  try {
    return execSync("git describe --tags --abbrev=0", { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim().replace(/^v/, "");
  } catch {
    const pkg = JSON.parse(readFileSync("./package.json", "utf8"));
    return pkg.version;
  }
})();

export default defineConfig({
  base: "/Comdr-Download/",
  define: {
    __APP_VERSION__: JSON.stringify(VERSION),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2022",
    outDir: "docs",
    emptyOutDir: true,
  },
});
