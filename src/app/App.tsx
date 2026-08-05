import * as Sentry from "@sentry/react";
import { Route, Routes } from "react-router-dom";

import { CookieConsentBanner } from "@/components/privacy/CookieConsentBanner";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { TermsPage } from "@/pages/TermsPage";
import { routes } from "@/routes/routes";

function ProductionErrorFallback() {
  return (
    <main className="min-h-dvh grid place-items-center px-6 bg-surface">
      <section className="max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          The error was reported automatically. Please refresh the page.
        </p>
      </section>
    </main>
  );
}

/**
 * App shell. Wires the router; pages own their own layout.
 */
export function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ProductionErrorFallback />}>
      <Routes>
        <Route path={routes.home} element={<HomePage />} />
        <Route path={routes.privacy} element={<PrivacyPage />} />
        <Route path={routes.terms} element={<TermsPage />} />
        <Route path={routes.projects} element={<ProjectsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <CookieConsentBanner />
    </Sentry.ErrorBoundary>
  );
}
