import { Link, useNavigate } from "react-router-dom";

import { AvatarPlaceholder } from "@/components/avatar/AvatarPlaceholder";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { usePageMetadata } from "@/lib/pageMetadata";
import { routes } from "@/routes/routes";

/**
 * Landing / cover page.
 *
 * Single-page entry point: title, avatar placeholder, primary CTA -> /projects.
 * Routing is centralized in `routes/routes.ts` to avoid magic strings.
 */
export function HomePage() {
  const navigate = useNavigate();

  usePageMetadata({
    title: "LevelUp User | Project Portfolio",
    description:
      "A personal portfolio for software projects, product ideas, and active builds by LevelUp User.",
  });

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
      </header>

      <AvatarPlaceholder />

      <Button
        onClick={() => navigate(routes.projects)}
        aria-label="Go to projects"
        className="w-full sm:w-auto min-w-[160px]"
      >
        Projects
      </Button>

      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link className="text-sm font-medium text-slate-500 hover:text-brand" to={routes.privacy}>
          Privacy Policy
        </Link>
        <Link className="text-sm font-medium text-slate-500 hover:text-brand" to={routes.terms}>
          Terms of Service
        </Link>
      </nav>
    </PageContainer>
  );
}
