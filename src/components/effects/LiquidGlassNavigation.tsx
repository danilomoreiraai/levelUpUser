import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";

import { initializeLiquidGlass } from "@/lib/liquidGlass";
import { routes } from "@/routes/routes";

const TARGET_ID = "levelup-liquid-navigation";

function getLinkClasses({ isActive }: { isActive: boolean }) {
  const stateClasses = isActive
    ? "bg-white/90 text-brand shadow-sm"
    : "text-slate-700 hover:bg-white/55 hover:text-brand";

  return [
    "rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
    stateClasses,
  ].join(" ");
}

/**
 * Persistent app navigation and liquidGL target.
 *
 * Keep this component outside Routes: liquidGL 2.0.1 has no public teardown
 * API, so remounting targets would retain stale lenses in its shared renderer.
 */
export function LiquidGlassNavigation() {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;

    if (!target) {
      return;
    }

    void initializeLiquidGlass({
      target,
      targetSelector: `#${TARGET_ID}`,
    }).catch((error: unknown) => {
      console.error("Unable to initialize liquid glass navigation", error);
    });
  }, []);

  return (
    <div
      className="fixed right-4 top-4 z-40 rounded-full bg-white/25 p-1.5 sm:right-6 sm:top-6"
      id={TARGET_ID}
      ref={targetRef}
    >
      <nav
        aria-label="Primary navigation"
        className="pointer-events-auto relative z-[3] flex items-center gap-1"
      >
        <NavLink className={getLinkClasses} end to={routes.home}>
          Home
        </NavLink>
        <NavLink className={getLinkClasses} to={routes.projects}>
          Projects
        </NavLink>
        <NavLink className={getLinkClasses} to={routes.services}>
          Services
        </NavLink>
      </nav>
    </div>
  );
}
