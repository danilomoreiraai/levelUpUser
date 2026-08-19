import { hasOptionalCookieConsent, subscribeToCookieConsentChange } from "@/lib/privacyConsent";
import { appRelease } from "@/lib/release";

const defaultEnvironment = import.meta.env.PROD ? "production" : "development";
let hasInitializedMonitoring = false;
let sentryModulePromise: Promise<typeof import("@sentry/react")> | undefined;

function getTraceSampleRate() {
  const sampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0");

  if (Number.isNaN(sampleRate) || sampleRate < 0 || sampleRate > 1) {
    return 0;
  }

  return sampleRate;
}

function loadSentry() {
  sentryModulePromise ??= import("@sentry/react");
  return sentryModulePromise;
}

async function initializeMonitoring() {
  if (hasInitializedMonitoring || !hasOptionalCookieConsent()) {
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  const Sentry = await loadSentry();

  if (hasInitializedMonitoring || !hasOptionalCookieConsent()) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_APP_ENV || defaultEnvironment,
    release: appRelease === "unknown" ? undefined : appRelease,
    tracesSampleRate: getTraceSampleRate(),
    sendDefaultPii: false,
  });
  hasInitializedMonitoring = true;
}

export function initMonitoring() {
  void initializeMonitoring();
}

async function stopMonitoring() {
  if (!hasInitializedMonitoring) {
    return;
  }

  const Sentry = await loadSentry();
  await Sentry.close(2_000);
  hasInitializedMonitoring = false;
}

export function initMonitoringConsentListener() {
  return subscribeToCookieConsentChange((consent) => {
    if (consent.preferences.monitoring) {
      initMonitoring();
      return;
    }

    void stopMonitoring();
  });
}

export async function captureRuntimeError(
  error: unknown,
  context?: Record<string, string | number | boolean>,
) {
  if (!hasOptionalCookieConsent()) {
    return;
  }

  await initializeMonitoring();

  if (!hasInitializedMonitoring) {
    return;
  }

  const Sentry = await loadSentry();
  Sentry.captureException(error, { extra: context });
}
