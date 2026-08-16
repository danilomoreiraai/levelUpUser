import type { Metric } from "web-vitals";

import {
  type CookieConsentPreferences,
  getCookieConsent,
  hasCookieConsent,
  subscribeToCookieConsentChange,
} from "@/lib/privacyConsent";

let hasInitializedWebVitals = false;
let openTelemetryProvider: { shutdown(): Promise<void> } | undefined;
let isInitializingOpenTelemetry = false;

function reportWebVital(metric: Metric) {
  const attributes = {
    metric_delta: metric.delta,
    metric_id: metric.id,
    metric_rating: metric.rating,
    metric_value: metric.value,
  };

  if (hasCookieConsent("analytics")) {
    window.gtag?.("event", metric.name, attributes);
  }

  if (hasCookieConsent("monitoring")) {
    void import("@sentry/react").then((Sentry) => {
      Sentry.captureMessage(`Web Vital: ${metric.name}`, {
        extra: attributes,
        level: metric.rating === "poor" ? "warning" : "info",
        tags: { metric: metric.name, rating: metric.rating },
      });
    });
  }
}

async function initializeWebVitals() {
  if (hasInitializedWebVitals) return;

  const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import("web-vitals");
  onCLS(reportWebVital);
  onFCP(reportWebVital);
  onINP(reportWebVital);
  onLCP(reportWebVital);
  onTTFB(reportWebVital);
  hasInitializedWebVitals = true;
}

async function initializeOpenTelemetry() {
  const endpoint = import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT;

  if (
    !endpoint ||
    openTelemetryProvider ||
    isInitializingOpenTelemetry ||
    !hasCookieConsent("monitoring")
  ) {
    return;
  }

  isInitializingOpenTelemetry = true;

  try {
    const [{ trace }, { OTLPTraceExporter }, { resourceFromAttributes }, traceBase, traceWeb] =
      await Promise.all([
        import("@opentelemetry/api"),
        import("@opentelemetry/exporter-trace-otlp-http"),
        import("@opentelemetry/resources"),
        import("@opentelemetry/sdk-trace-base"),
        import("@opentelemetry/sdk-trace-web"),
      ]);

    if (!hasCookieConsent("monitoring")) return;

    const exporter = new OTLPTraceExporter({ url: endpoint });
    const provider = new traceWeb.WebTracerProvider({
      resource: resourceFromAttributes({
        "deployment.environment.name":
          import.meta.env.VITE_APP_ENV || (import.meta.env.PROD ? "production" : "development"),
        "service.name": "levelup-user-web",
      }),
      spanProcessors: [new traceBase.BatchSpanProcessor(exporter)],
    });
    provider.register();
    openTelemetryProvider = provider;

    const span = trace.getTracer("levelup-user-web").startSpan("app.bootstrap");
    span.setAttribute("app.route", window.location.pathname);
    span.end();
  } finally {
    isInitializingOpenTelemetry = false;
  }
}

async function stopOpenTelemetry() {
  const provider = openTelemetryProvider;
  openTelemetryProvider = undefined;
  await provider?.shutdown();
}

function applyTelemetryConsent(preferences: CookieConsentPreferences) {
  if (preferences.analytics || preferences.monitoring) {
    void initializeWebVitals();
  }

  if (preferences.monitoring) {
    void initializeOpenTelemetry();
  } else {
    void stopOpenTelemetry();
  }
}

export function initTelemetryConsent() {
  const consent = getCookieConsent();
  if (consent) applyTelemetryConsent(consent.preferences);

  return subscribeToCookieConsentChange((nextConsent) => {
    applyTelemetryConsent(nextConsent.preferences);
  });
}
