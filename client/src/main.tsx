import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { DEPLOY_TIMESTAMP } from "./buildTimestamp";
console.log("[BUILD] Deploy timestamp:", DEPLOY_TIMESTAMP);
import { initializeLanguage } from "@/lib/i18n";
import CrashlyticsService from "@/services/crashlytics";
import ErrorBoundary from "@/components/ErrorBoundary";

async function checkForStaleBuildAndAutoHeal() {
  try {
    const RELOAD_FLAG = "caren_autoheal_reloaded_at";
    const now = Date.now();
    const lastReload = parseInt(sessionStorage.getItem(RELOAD_FLAG) || "0", 10);
    if (now - lastReload < 30_000) return;

    const [bundledRes, liveRes] = await Promise.all([
      fetch("/build-info.json", { cache: "no-store" }).catch(() => null),
      fetch("/api/version", { cache: "no-store", credentials: "omit" }).catch(() => null),
    ]);
    if (!bundledRes?.ok || !liveRes?.ok) return;
    const bundled = await bundledRes.json();
    const live = await liveRes.json();
    const bundledCommit = bundled?.commit;
    const liveCommit = live?.commit;
    if (!bundledCommit || !liveCommit || bundledCommit === liveCommit) return;

    console.warn("[AUTO_HEAL] Stale build detected. bundled=", bundledCommit, "live=", liveCommit, "→ clearing caches and reloading");
    sessionStorage.setItem(RELOAD_FLAG, String(now));

    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    const url = new URL(window.location.href);
    url.searchParams.set("_v", liveCommit.slice(0, 7));
    window.location.replace(url.toString());
  } catch (err) {
    console.error("[AUTO_HEAL] check failed", err);
  }
}
checkForStaleBuildAndAutoHeal();

// Initialize language from localStorage
initializeLanguage();

// Handle screenshot mode auth token from URL
const urlParams = new URLSearchParams(window.location.search);
const authToken = urlParams.get('authToken');
if (authToken && import.meta.env.MODE === 'development') {
  localStorage.setItem('regularSessionToken', authToken);
  console.log('[SCREENSHOT_MODE] Auth token set from URL:', authToken);
}

// Initialize Crashlytics early (sets up global error handlers)
CrashlyticsService.initialize().then(() => {
  CrashlyticsService.logBreadcrumb('App starting up');
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
