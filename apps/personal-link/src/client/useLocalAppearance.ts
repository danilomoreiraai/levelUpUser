import { useEffect, useState } from "react";

import { getLocalTheme, getMillisecondsUntilThemeBoundary } from "../shared/theme";

export function useLocalAppearance() {
  const [appearance, setAppearance] = useState(() => {
    const now = new Date();
    return { theme: getLocalTheme(now), year: now.getFullYear() };
  });

  useEffect(() => {
    let timer: number;

    function refresh() {
      window.clearTimeout(timer);
      const now = new Date();
      const year = now.getFullYear();
      setAppearance({ theme: getLocalTheme(now), year });
      const untilNewYear = new Date(year + 1, 0, 1).getTime() - now.getTime();
      timer = window.setTimeout(
        refresh,
        Math.min(getMillisecondsUntilThemeBoundary(now), untilNewYear),
      );
    }

    refresh();
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return appearance;
}
