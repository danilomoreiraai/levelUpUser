import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const baseClasses =
  "inline-flex items-center justify-center " +
  "px-6 py-3 rounded-full " +
  "text-base font-medium " +
  "transition-colors duration-150 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white shadow-sm hover:bg-brand-hover active:bg-brand-active",
  secondary: "bg-white text-brand ring-1 ring-brand/20 hover:bg-brand/5 active:bg-brand/10",
};

/**
 * Accessible, reusable button. Apple-style pill, brand colors.
 *
 * Use `variant="primary"` for the main CTA, `secondary` for supporting actions.
 * Forwards `ref` so it composes with router `Link` via `asChild` patterns later if needed.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", type = "button", ...props },
  ref,
) {
  const classes = [baseClasses, variantClasses[variant], className].filter(Boolean).join(" ");

  return <button ref={ref} type={type} className={classes} {...props} />;
});
