import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeLanguage } from "@/lib/i18n";
import CrashlyticsService from "@/services/crashlytics";
import ErrorBoundary from "@/components/ErrorBoundary";

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

// Hide the diagnostic overlay once React successfully mounts
const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
// Signal to the diagnostic overlay that React started
if (typeof (window as any).carenDiagHide === 'function') {
  (window as any).carenDiagHide();
}
