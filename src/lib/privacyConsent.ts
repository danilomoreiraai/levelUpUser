export type CookieConsentChoice = "accepted" | "rejected";

type StoredCookieConsent = {
  choice: CookieConsentChoice;
  version: number;
  updatedAt: string;
};

const consentStorageKey = "levelupuser.cookieConsent";
const consentVersion = 1;
const consentChangedEvent = "levelupuser-cookie-consent-changed";

function isStoredCookieConsent(value: unknown): value is StoredCookieConsent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredCookieConsent>;

  return (
    candidate.version === consentVersion &&
    (candidate.choice === "accepted" || candidate.choice === "rejected") &&
    typeof candidate.updatedAt === "string"
  );
}

export function getCookieConsent(): StoredCookieConsent | null {
  try {
    const rawConsent = window.localStorage.getItem(consentStorageKey);

    if (!rawConsent) {
      return null;
    }

    const parsedConsent: unknown = JSON.parse(rawConsent);

    if (!isStoredCookieConsent(parsedConsent)) {
      return null;
    }

    return parsedConsent;
  } catch {
    return null;
  }
}

export function hasOptionalCookieConsent() {
  return getCookieConsent()?.choice === "accepted";
}

export function saveCookieConsent(choice: CookieConsentChoice) {
  const consent: StoredCookieConsent = {
    choice,
    version: consentVersion,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(consentStorageKey, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent(consentChangedEvent, { detail: consent }));

  return consent;
}

export function subscribeToCookieConsentChange(
  listener: (consent: StoredCookieConsent) => void,
) {
  const eventListener = (event: Event) => {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    if (isStoredCookieConsent(event.detail)) {
      listener(event.detail);
    }
  };

  window.addEventListener(consentChangedEvent, eventListener);

  return () => window.removeEventListener(consentChangedEvent, eventListener);
}
