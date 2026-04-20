import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "client", "src", "assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  define: {
    // Explicitly inject secrets that Vite's env loader may not pick up from
    // the process environment (e.g. Replit secrets during shell-based builds).
    // JSON.stringify wraps the value in quotes so it becomes a string literal in the bundle.
    "import.meta.env.VITE_REVENUECAT_IOS_API_KEY": JSON.stringify(
      process.env.VITE_REVENUECAT_IOS_API_KEY ?? ""
    ),
    "import.meta.env.VITE_STRIPE_PUBLIC_KEY": JSON.stringify(
      process.env.VITE_STRIPE_PUBLIC_KEY ?? ""
    ),
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
