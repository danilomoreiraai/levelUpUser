/**
 * Centralized route definitions.
 *
 * Keep all path strings here so pages, links, and tests share one source of truth.
 * Add new routes as `as const` keys to preserve literal types.
 */
export const routes = {
  home: "/",
  projects: "/projects",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
