import { captureRuntimeError } from "@/lib/monitoring";
import { appRelease } from "@/lib/release";

const recoveryKeyPrefix = "levelupuser.chunk-recovery";
const recoveryResetDelayMs = 10_000;

type VitePreloadErrorEvent = Event & {
  payload?: unknown;
};

function getRecoveryKey() {
  return `${recoveryKeyPrefix}:${appRelease}:${window.location.pathname}`;
}

function hasRecoveryAttempt() {
  try {
    return window.sessionStorage.getItem(getRecoveryKey()) === "1";
  } catch {
    return true;
  }
}

function markRecoveryAttempt() {
  try {
    window.sessionStorage.setItem(getRecoveryKey(), "1");
    return true;
  } catch {
    return false;
  }
}

function clearRecoveryAttempt() {
  try {
    window.sessionStorage.removeItem(getRecoveryKey());
  } catch {
    // Session storage can be unavailable in strict browser privacy modes.
  }
}

export function handleVitePreloadError(event: VitePreloadErrorEvent, reloadPage: () => void) {
  if (!navigator.onLine || hasRecoveryAttempt()) {
    return false;
  }

  if (!markRecoveryAttempt()) {
    return false;
  }

  event.preventDefault();
  void captureRuntimeError(event.payload ?? new Error("Vite preload failed"), {
    mechanism: "vite_preload_error",
    online: navigator.onLine,
    pathname: window.location.pathname,
    release: appRelease,
  });
  reloadPage();
  return true;
}

export function initChunkRecovery() {
  const listener = (event: Event) => {
    handleVitePreloadError(event as VitePreloadErrorEvent, () => window.location.reload());
  };

  window.addEventListener("vite:preloadError", listener);
  window.setTimeout(clearRecoveryAttempt, recoveryResetDelayMs);

  return () => window.removeEventListener("vite:preloadError", listener);
}
