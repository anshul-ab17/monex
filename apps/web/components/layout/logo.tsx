import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Reishi brand mark — an abstract crystal/seed glyph (inline SVG, no emoji).
 * Drawn on a gradient rounded tile with the REISHI wordmark beside it.
 */
export function Logo({
  className,
  href = "/",
  withWordmark = true,
}: {
  className?: string;
  href?: string;
  withWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2", className)}
      aria-label="Reishi"
    >
      <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#4DD6C2_0%,#2BBE9B_100%)] shadow-[0_0_14px_rgba(77,214,194,0.35)]">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8 1.5L13.5 5V11L8 14.5L2.5 11V5L8 1.5Z"
            stroke="#04110E"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M8 1.5V14.5M8 7.75L13.5 5M8 7.75L2.5 5"
            stroke="#04110E"
            strokeWidth="1.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {withWordmark && (
        <span className="text-sm font-bold tracking-wide text-text-primary">
          REISHI
        </span>
      )}
    </Link>
  );
}
