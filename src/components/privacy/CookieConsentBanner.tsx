import { useState } from "react";
import { Link } from "react-router-dom";

import {
  getCookieConsent,
  saveCookieConsent,
  type CookieConsentChoice,
} from "@/lib/privacyConsent";
import { routes } from "@/routes/routes";

type ConsentView = "banner" | "preferences";

function persistConsent(choice: CookieConsentChoice) {
  saveCookieConsent(choice);
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(() => getCookieConsent() === null);
  const [view, setView] = useState<ConsentView>("banner");

  if (!isVisible) {
    return null;
  }

  const handleChoice = (choice: CookieConsentChoice) => {
    persistConsent(choice);
    setIsVisible(false);
  };

  return (
    <section
      aria-label="Cookie consent"
      className="
        fixed inset-x-0 bottom-0 z-50
        border-t border-slate-200 bg-white/95 px-4 py-4 shadow-2xl
        backdrop-blur
      "
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-base font-semibold text-slate-900">
            We use cookies and similar storage
          </p>
          {view === "banner" ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Essential storage keeps this site working. Optional monitoring
              helps us understand errors and performance, and only starts if
              you accept it. Read the{" "}
              <Link className="font-medium text-brand underline" to={routes.privacy}>
                privacy policy
              </Link>
              .
            </p>
          ) : (
            <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium text-slate-900">Essential</p>
                <p className="mt-1">
                  Required for security, routing, and saving your consent choice.
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Always active
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium text-slate-900">Optional monitoring</p>
                <p className="mt-1">
                  Allows privacy-conscious error and performance reporting.
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Your choice
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row md:shrink-0">
          {view === "banner" ? (
            <button
              className="rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              type="button"
              onClick={() => setView("preferences")}
            >
              Manage
            </button>
          ) : null}
          <button
            className="rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            type="button"
            onClick={() => handleChoice("rejected")}
          >
            Reject optional
          </button>
          <button
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
            type="button"
            onClick={() => handleChoice("accepted")}
          >
            Accept all
          </button>
        </div>
      </div>
    </section>
  );
}
