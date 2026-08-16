import {
  type CookieConsentPreferences,
  getCookieConsent,
  subscribeToCookieConsentChange,
} from "@/lib/privacyConsent";

let hasInitializedAnalytics = false;
let hasInitializedMarketing = false;

function appendScript(id: string, source: string) {
  if (document.getElementById(id)) return;

  const script = document.createElement("script");
  script.async = true;
  script.id = id;
  script.src = source;
  document.head.appendChild(script);
}

function updateGoogleConsent(isGranted: boolean) {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;

  window[`ga-disable-${measurementId}`] = !isGranted;
  window.gtag?.("consent", "update", {
    analytics_storage: isGranted ? "granted" : "denied",
  });
}

function initializeGoogleAnalytics() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId || hasInitializedAnalytics) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
  window.gtag("js", new Date());
  window.gtag("consent", "default", { analytics_storage: "granted" });
  window.gtag("config", measurementId, {
    allow_google_signals: false,
    anonymize_ip: true,
  });
  appendScript(
    "levelup-google-analytics",
    `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`,
  );
  hasInitializedAnalytics = true;
}

function updateMetaConsent(isGranted: boolean) {
  window.fbq?.("consent", isGranted ? "grant" : "revoke");
}

function initializeMetaPixel() {
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (!pixelId || hasInitializedMarketing) return;

  const queue: unknown[][] = [];
  const fbq = (...args: unknown[]) => queue.push(args);
  fbq.queue = queue;
  window.fbq = fbq;
  window.fbq("consent", "grant");
  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
  appendScript("levelup-meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
  hasInitializedMarketing = true;
}

function applyTrackingConsent(preferences: CookieConsentPreferences) {
  if (preferences.analytics) initializeGoogleAnalytics();
  else updateGoogleConsent(false);

  if (preferences.marketing) initializeMetaPixel();
  else updateMetaConsent(false);
}

export function initTrackingConsent() {
  const consent = getCookieConsent();
  if (consent) applyTrackingConsent(consent.preferences);

  return subscribeToCookieConsentChange((nextConsent) => {
    applyTrackingConsent(nextConsent.preferences);
  });
}
