import * as Sentry from "@sentry/react";

const defaultEnvironment = import.meta.env.PROD ? "production" : "development";

function getTraceSampleRate() {
  const sampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0");

  if (Number.isNaN(sampleRate) || sampleRate < 0 || sampleRate > 1) {
    return 0;
  }

  return sampleRate;
}

export function initMonitoring() {
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
}
