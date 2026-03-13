import { Capacitor } from '@capacitor/core';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: number;
  [key: string]: any;
}

interface BufferedError {
  message: string;
  stack?: string;
  component?: string;
  action?: string;
  userId?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  count: number;
  breadcrumbs: string[];
}

const MAX_BUFFER_SIZE = 50;
const FLUSH_INTERVAL_MS = 30_000;
const DEDUP_WINDOW_MS = 60_000;
const MAX_BREADCRUMBS = 20;

class CrashlyticsService {
  private static isNativeApp = Capacitor.isNativePlatform();
  private static errorBuffer: BufferedError[] = [];
  private static breadcrumbs: string[] = [];
  private static flushTimer: ReturnType<typeof setInterval> | null = null;
  private static currentUserId: string | undefined;
  private static initialized = false;

  static async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    this.currentUserId = userId;

    console.log('[CRASHLYTICS] Initializing error reporting service');

    window.onerror = (message, source, lineno, colno, error) => {
      const err = error || new Error(String(message));
      this.recordError(err, {
        component: 'window.onerror',
        action: 'global_error',
        filename: source,
        lineno,
        colno,
        timestamp: Date.now()
      });
    };

    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.recordError(err, {
        component: 'window.onunhandledrejection',
        action: 'unhandled_promise',
        timestamp: Date.now()
      });
    };

    this.flushTimer = setInterval(() => {
      this.flush();
    }, FLUSH_INTERVAL_MS);
  }

  static async setUserId(userId: string): Promise<void> {
    this.currentUserId = userId;
  }

  static async recordError(error: Error, context?: ErrorContext): Promise<void> {
    console.error('[CRASHLYTICS] Error:', error.message, context);

    const now = Date.now();
    const message = error.message || 'Unknown error';
    const stack = error.stack || '';

    const existing = this.errorBuffer.find(
      (e) =>
        e.message === message &&
        e.stack === stack &&
        now - e.timestamp < DEDUP_WINDOW_MS
    );

    if (existing) {
      existing.count += 1;
      existing.breadcrumbs = [...this.breadcrumbs];
      return;
    }

    if (this.errorBuffer.length >= MAX_BUFFER_SIZE) {
      this.errorBuffer.shift();
    }

    this.errorBuffer.push({
      message,
      stack,
      component: context?.component,
      action: context?.action,
      userId: context?.userId || this.currentUserId,
      timestamp: now,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      count: 1,
      breadcrumbs: [...this.breadcrumbs]
    });

    const isCritical =
      context?.action === 'global_error' ||
      context?.action === 'unhandled_promise' ||
      context?.component === 'ErrorBoundary';

    if (isCritical) {
      this.flush();
    }
  }

  static async logBreadcrumb(message: string): Promise<void> {
    console.log(`[CRASHLYTICS] Breadcrumb: ${message}`);
    const entry = `[${new Date().toISOString()}] ${message}`;
    if (this.breadcrumbs.length >= MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
    this.breadcrumbs.push(entry);
  }

  static async setCustomKey(_key: string, _value: string | number | boolean): Promise<void> {}

  static async didCrashOnPreviousExecution(): Promise<boolean> {
    return false;
  }

  static async testCrash(): Promise<void> {
    console.warn('[CRASHLYTICS] Test crash called on web platform');
  }

  static async recordEmergencyAction(action: string, location?: { lat: number; lng: number }): Promise<void> {
    await this.logBreadcrumb(`Emergency action: ${action}`);
  }

  static async recordLegalInteraction(state: string, interactionType: string): Promise<void> {
    await this.logBreadcrumb(`Legal interaction: ${interactionType} in ${state}`);
  }

  private static async flush(): Promise<void> {
    if (this.errorBuffer.length === 0) return;

    const errors = this.errorBuffer.splice(0, this.errorBuffer.length);

    try {
      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors })
      });

      if (!response.ok) {
        console.error('[CRASHLYTICS] Failed to report errors, status:', response.status);
        errors.forEach((e) => {
          if (this.errorBuffer.length < MAX_BUFFER_SIZE) {
            this.errorBuffer.push(e);
          }
        });
      }
    } catch (networkError) {
      console.error('[CRASHLYTICS] Network error reporting errors:', networkError);
      errors.forEach((e) => {
        if (this.errorBuffer.length < MAX_BUFFER_SIZE) {
          this.errorBuffer.push(e);
        }
      });
    }
  }
}

export default CrashlyticsService;
