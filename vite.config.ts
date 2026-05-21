import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Conditionally load Replit-only dev plugins so the project still builds
// locally (where these packages aren't installed).
async function loadReplitPlugins() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.REPL_ID === undefined
  ) {
    return [];
  }

  try {
    const [runtimeErrorMod, cartographerMod, themeMod] = await Promise.all([
      // @ts-ignore - Replit-only package; not installed locally.
      import("@replit/vite-plugin-runtime-error-modal"),
      // @ts-ignore - Replit-only package; not installed locally.
      import("@replit/vite-plugin-cartographer"),
      // @ts-ignore - Replit-only package; not installed locally.
      import("@replit/vite-plugin-shadcn-theme-json"),
    ]);
    return [
      runtimeErrorMod.default(),
      cartographerMod.cartographer(),
      themeMod.default(),
    ];
  } catch {
    // Replit plugins aren't installed locally - that's fine, just skip them.
    return [];
  }
}

const replitPlugins = await loadReplitPlugins();

export default defineConfig({
  plugins: [react(), ...replitPlugins],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  // The repo keeps static assets in /public at the project root.
  publicDir: path.resolve(__dirname, "public"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
