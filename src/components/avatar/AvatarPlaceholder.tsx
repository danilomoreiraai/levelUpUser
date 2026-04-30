type AvatarPlaceholderProps = {
  /** Size in px. Defaults to 144. */
  size?: number;
  /** Accessible label for the placeholder. */
  label?: string;
};

/**
 * Circular avatar placeholder with a neutral silhouette.
 *
 * Designed to be swapped later for a stylized avatar bust (image / SVG / animated component).
 * Keep the public API small (`size`, `label`) so future swaps are drop-in.
 */
export function AvatarPlaceholder({
  size = 144,
  label = "User avatar placeholder",
}: AvatarPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: size, height: size }}
      className="
        relative grid place-items-center
        rounded-full
        bg-white
        ring-1 ring-slate-200
        shadow-sm
        overflow-hidden
      "
    >
      <svg
        viewBox="0 0 64 64"
        className="h-3/5 w-3/5 text-brand/80"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="32" cy="22" r="12" />
        <path d="M12 56c0-11 9-20 20-20s20 9 20 20v2H12v-2z" />
      </svg>
    </div>
  );
}
