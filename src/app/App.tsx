import * as Sentry from "@sentry/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import { LiquidGlassNavigation } from "@/components/effects/LiquidGlassNavigation";
import { RouteLoadingState } from "@/components/feedback/RouteLoadingState";
import { CookieConsentBanner } from "@/components/privacy/CookieConsentBanner";
import { routes } from "@/routes/routes";

const HomePage = lazy(() =>
  import("@/pages/HomePage").then((module) => ({ default: module.HomePage })),
);
const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  })),
);
const PrivacyPage = lazy(() =>
  import("@/pages/PrivacyPage").then((module) => ({
    default: module.PrivacyPage,
  })),
);
const ProjectsPage = lazy(() =>
  import("@/pages/ProjectsPage").then((module) => ({
    default: module.ProjectsPage,
  })),
);
const ServicesPage = lazy(() =>
  import("@/pages/ServicesPage").then((module) => ({
    default: module.ServicesPage,
  })),
);
const TermsPage = lazy(() =>
  import("@/pages/TermsPage").then((module) => ({
    default: module.TermsPage,
  })),
);

function ProductionErrorFallback() {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-6">
      <section className="max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-sm text-slate-500">
          The error was reported automatically. Please refresh the page.
        </p>
      </section>
    </main>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const distance = prefersReducedMotion ? 0 : 12;
  const duration = prefersReducedMotion ? 0 : 0.24;

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -distance }}
        initial={{ opacity: 0, y: distance }}
        key={location.pathname}
        transition={{ duration, ease: "easeOut" }}
      >
        <Suspense fallback={<RouteLoadingState />}>
          <Routes location={location}>
            <Route path={routes.home} element={<HomePage />} />
            <Route path={routes.privacy} element={<PrivacyPage />} />
            <Route path={routes.terms} element={<TermsPage />} />
            <Route path={routes.projects} element={<ProjectsPage />} />
            <Route path={routes.services} element={<ServicesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

/** App shell with persistent controls and animated, lazy-loaded routes. */
export function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ProductionErrorFallback />}>
      <LiquidGlassNavigation />
      <AnimatedRoutes />
      <CookieConsentBanner />
    </Sentry.ErrorBoundary>
  );
}
