import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
};

/**
 * Full-viewport container that vertically + horizontally centers its content.
 * Mobile-first; uses `dvh` so iOS toolbars don't clip the layout.
 */
export function PageContainer({ children }: PageContainerProps) {
  return (
    <main
      className="
        min-h-dvh w-full
        flex flex-col items-center justify-center
        px-6 py-12
        bg-gradient-to-b from-surface to-surface-subtle
      "
    >
      <div className="w-full max-w-md flex flex-col items-center gap-10">{children}</div>
    </main>
  );
}
