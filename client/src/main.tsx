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

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
