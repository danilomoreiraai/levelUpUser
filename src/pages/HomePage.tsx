import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import { AvatarPlaceholder } from "@/components/avatar/AvatarPlaceholder";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { routes } from "@/routes/routes";

/**
 * Landing / cover page.
 *
 * Single-page entry point: title, avatar placeholder, primary CTA -> /projects.
 * Routing is centralized in `routes/routes.ts` to avoid magic strings.
 */
export function HomePage() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <header className="flex flex-col items-center gap-3 text-center">
        <h1
          className="
            text-4xl sm:text-5xl md:text-6xl
            font-semibold tracking-tight
            text-slate-900
          "
        >
          LevelUp <span className="text-brand">User</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-xs">
          Growth, progress, and digital identity — start your journey.
        </p>
      </header>

      <AvatarPlaceholder />

      <Button
        onClick={() => navigate(routes.projects)}
        aria-label="Go to projects"
        className="w-full sm:w-auto min-w-[160px]"
      >
        Projects
      </Button>

      <Link
        className="text-sm font-medium text-slate-500 hover:text-brand"
        to={routes.privacy}
      >
        Privacy Policy
      </Link>
    </PageContainer>
  );
}
