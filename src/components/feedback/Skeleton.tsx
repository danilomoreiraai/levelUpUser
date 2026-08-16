import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export function Skeleton({ className = "", label, ...props }: SkeletonProps) {
  return (
    <div
      aria-label={label}
      aria-hidden={label ? undefined : true}
      aria-live={label ? "polite" : undefined}
      className={`skeleton overflow-hidden bg-slate-200/80 ${className}`}
      role="status"
      {...props}
    />
  );
}
