import { useEffect, useState } from "react";

import { getLocalTheme, getMillisecondsUntilThemeBoundary } from "../shared/theme";

export function useLocalTheme() {
  const [theme, setTheme] = useState(() => getLocalTheme());

  useEffect(() => {
    let timer: number;

    function refresh() {
      window.clearTimeout(timer);
      const now = new Date();
      setTheme(getLocalTheme(now));
      timer = window.setTimeout(refresh, getMillisecondsUntilThemeBoundary(now));
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

  return theme;
}
