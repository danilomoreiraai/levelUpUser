export type ConsentCategory = "analytics" | "marketing" | "monitoring";

export type CookieConsentPreferences = Record<ConsentCategory, boolean>;

export type StoredCookieConsent = {
  preferences: CookieConsentPreferences;
  version: number;
  updatedAt: string;
};

type LegacyCookieConsent = {
  choice: "accepted" | "rejected";
  version: 1;
  updatedAt: string;
};

const consentStorageKey = "levelupuser.cookieConsent";
const consentVersion = 2;
const consentChangedEvent = "levelupuser-cookie-consent-changed";

export const rejectedOptionalConsent: CookieConsentPreferences = {
  analytics: false,
  marketing: false,
  monitoring: false,
};

export const acceptedOptionalConsent: CookieConsentPreferences = {
  analytics: true,
  marketing: true,
  monitoring: true,
};

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isStoredCookieConsent(value: unknown): value is StoredCookieConsent {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<StoredCookieConsent>;
  const preferences = candidate.preferences;

  return (
    candidate.version === consentVersion &&
    typeof candidate.updatedAt === "string" &&
    !!preferences &&
    isBoolean(preferences.analytics) &&
    isBoolean(preferences.marketing) &&
    isBoolean(preferences.monitoring)
  );
}

function isLegacyCookieConsent(value: unknown): value is LegacyCookieConsent {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<LegacyCookieConsent>;

  return (
    candidate.version === 1 &&
    (candidate.choice === "accepted" || candidate.choice === "rejected") &&
    typeof candidate.updatedAt === "string"
  );
}

function migrateLegacyConsent(consent: LegacyCookieConsent): StoredCookieConsent {
  return {
    preferences: {
      ...rejectedOptionalConsent,
      monitoring: consent.choice === "accepted",
    },
    version: consentVersion,
    updatedAt: consent.updatedAt,
  };
}

export function getCookieConsent(): StoredCookieConsent | null {
  try {
    const rawConsent = window.localStorage.getItem(consentStorageKey);
    if (!rawConsent) return null;

    const parsedConsent: unknown = JSON.parse(rawConsent);
    if (isStoredCookieConsent(parsedConsent)) return parsedConsent;

    if (isLegacyCookieConsent(parsedConsent)) {
      const migratedConsent = migrateLegacyConsent(parsedConsent);
      window.localStorage.setItem(consentStorageKey, JSON.stringify(migratedConsent));
      return migratedConsent;
    }

    return null;
  } catch {
    return null;
  }
}

export function hasCookieConsent(category: ConsentCategory) {
  return getCookieConsent()?.preferences[category] === true;
}

export function hasOptionalCookieConsent() {
  return hasCookieConsent("monitoring");
}

export function saveCookieConsent(preferences: CookieConsentPreferences) {
  const consent: StoredCookieConsent = {
    preferences: { ...preferences },
    version: consentVersion,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(consentStorageKey, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent(consentChangedEvent, { detail: consent }));
  return consent;
}

export function subscribeToCookieConsentChange(listener: (consent: StoredCookieConsent) => void) {
  const eventListener = (event: Event) => {
    if (event instanceof CustomEvent && isStoredCookieConsent(event.detail)) {
      listener(event.detail);
    }
  };

  window.addEventListener(consentChangedEvent, eventListener);
  return () => window.removeEventListener(consentChangedEvent, eventListener);
}
