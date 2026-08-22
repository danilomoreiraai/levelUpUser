import { useState } from "react";
import { Link } from "react-router-dom";

import {
  acceptedOptionalConsent,
  type ConsentCategory,
  type CookieConsentPreferences,
  getCookieConsent,
  rejectedOptionalConsent,
  saveCookieConsent,
} from "@/lib/privacyConsent";
import { routes } from "@/routes/routes";

type ConsentView = "banner" | "preferences";

const preferenceOptions: {
  category: ConsentCategory;
  description: string;
  label: string;
}[] = [
  {
    category: "analytics",
    label: "Analytics",
    description: "Measures aggregate visits and usage through Google Analytics.",
  },
  {
    category: "marketing",
    label: "Marketing",
    description: "Enables Meta Pixel campaign measurement and attribution.",
  },
  {
    category: "monitoring",
    label: "Optional monitoring",
    description: "Reports application errors through GlitchTip-compatible monitoring.",
  },
];

function getInitialPreferences() {
  return getCookieConsent()?.preferences ?? rejectedOptionalConsent;
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(() => getCookieConsent() === null);
  const [view, setView] = useState<ConsentView>("banner");
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(getInitialPreferences);

  const persistPreferences = (nextPreferences: CookieConsentPreferences) => {
    saveCookieConsent(nextPreferences);
    setPreferences(nextPreferences);
    setIsVisible(false);
    setView("banner");
  };

  const openPreferences = () => {
    setPreferences(getInitialPreferences());
    setView("preferences");
    setIsVisible(true);
  };

  const togglePreference = (category: ConsentCategory) => {
    setPreferences((current) => ({ ...current, [category]: !current[category] }));
  };

  if (!isVisible) {
    return (
      <button
        className="fixed bottom-4 left-4 z-40 rounded-full bg-white/95 px-4 py-2 text-xs font-medium text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:text-brand"
        onClick={openPreferences}
        type="button"
      >
        Privacy choices
      </button>
    );
  }

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-2xl backdrop-blur"
      data-liquid-ignore
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-base font-semibold text-slate-900">Your privacy choices</p>
          {view === "banner" ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Essential storage keeps this site working. Analytics, marketing, and optional
              monitoring start only with your permission. Read the{" "}
              <Link className="font-medium text-brand underline" to={routes.privacy}>
                privacy policy
              </Link>
              .
            </p>
          ) : (
            <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium text-slate-900">Essential</p>
                <p className="mt-1">Stores your consent choice and supports routing.</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Always active
                </p>
              </div>
              {preferenceOptions.map((option) => (
                <label
                  className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3"
                  key={option.category}
                >
                  <input
                    checked={preferences[option.category]}
                    className="mt-1 size-4 accent-brand"
                    onChange={() => togglePreference(option.category)}
                    type="checkbox"
                  />
                  <span>
                    <span className="font-medium text-slate-900">{option.label}</span>
                    <span className="mt-1 block">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row md:shrink-0">
          {view === "banner" ? (
            <button
              className="rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50"
              onClick={() => setView("preferences")}
              type="button"
            >
              Manage
            </button>
          ) : (
            <button
              className="rounded-full px-5 py-2.5 text-sm font-medium text-brand ring-1 ring-brand/30 transition hover:bg-brand/5"
              onClick={() => persistPreferences(preferences)}
              type="button"
            >
              Save choices
            </button>
          )}
          <button
            className="rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50"
            onClick={() => persistPreferences(rejectedOptionalConsent)}
            type="button"
          >
            Reject optional
          </button>
          <button
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover"
            onClick={() => persistPreferences(acceptedOptionalConsent)}
            type="button"
          >
            Accept all
          </button>
        </div>
      </div>
    </section>
  );
}
