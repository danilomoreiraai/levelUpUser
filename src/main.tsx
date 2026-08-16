import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "@/app/App";
import { initMonitoring, initMonitoringConsentListener } from "@/lib/monitoring";
import { initTelemetryConsent } from "@/lib/telemetry";
import { initTrackingConsent } from "@/lib/tracking";
import "@/styles/globals.css";

initMonitoring();
initMonitoringConsentListener();
initTrackingConsent();
initTelemetryConsent();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
