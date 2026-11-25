export type LocalTheme = "light" | "dark";

export function getLocalTheme(date = new Date()): LocalTheme {
  const hour = date.getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

export function getMillisecondsUntilThemeBoundary(now = new Date()): number {
  const next = new Date(now);
  const hour = now.getHours();
  if (hour >= 18) {
    next.setDate(next.getDate() + 1);
  }
  next.setHours(hour >= 6 && hour < 18 ? 18 : 6, 0, 0, 0);
  return next.getTime() - now.getTime();
}
