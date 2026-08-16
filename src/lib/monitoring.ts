import * as Sentry from "@sentry/react";

import { hasOptionalCookieConsent, subscribeToCookieConsentChange } from "@/lib/privacyConsent";

const defaultEnvironment = import.meta.env.PROD ? "production" : "development";
let hasInitializedMonitoring = false;

type ProjectMetricAction = "project_card_hover" | "project_link_click" | "project_thumbnail_error";

function getTraceSampleRate() {
  const sampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0");

  if (Number.isNaN(sampleRate) || sampleRate < 0 || sampleRate > 1) {
    return 0;
  }

  return sampleRate;
}

export function initMonitoring() {
  if (hasInitializedMonitoring || !hasOptionalCookieConsent()) {
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_APP_ENV || defaultEnvironment,
    tracesSampleRate: getTraceSampleRate(),
    sendDefaultPii: false,
  });
  hasInitializedMonitoring = true;
}

export function initMonitoringConsentListener() {
  return subscribeToCookieConsentChange((consent) => {
    if (consent.preferences.monitoring) {
      initMonitoring();
    }
  });
}

function getProjectMetricKey(action: ProjectMetricAction, projectTitle: string) {
  return `levelup-project-metric:${action}:${projectTitle}`;
}

function hasTrackedProjectMetric(action: ProjectMetricAction, projectTitle: string) {
  try {
    return sessionStorage.getItem(getProjectMetricKey(action, projectTitle)) === "1";
  } catch {
    return false;
  }
}

function markProjectMetricTracked(action: ProjectMetricAction, projectTitle: string) {
  try {
    sessionStorage.setItem(getProjectMetricKey(action, projectTitle), "1");
  } catch {
    // Session storage can be unavailable in strict browser privacy modes.
  }
}

export function trackProjectMetric({
  action,
  phase,
  projectTitle,
  status,
  url,
}: {
  action: ProjectMetricAction;
  phase: string;
  projectTitle: string;
  status: string;
  url?: string;
}) {
  if (!hasInitializedMonitoring || !hasOptionalCookieConsent()) {
    return;
  }

  const shouldTrackOnce = action !== "project_link_click";

  if (shouldTrackOnce && hasTrackedProjectMetric(action, projectTitle)) {
    return;
  }

  Sentry.captureMessage(`Project metric: ${action}`, {
    level: "info",
    tags: {
      action,
      phase,
      project: projectTitle,
      status,
    },
    extra: {
      projectTitle,
      url,
    },
  });

  if (shouldTrackOnce) {
    markProjectMetricTracked(action, projectTitle);
  }
}
