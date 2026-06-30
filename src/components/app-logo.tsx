import { useId } from "react";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  className?: string;
  size?: "sm" | "md";
};

export function AppLogo({ className, size = "md" }: AppLogoProps) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn(
        "shrink-0 text-white",
        size === "sm" ? "size-4" : "size-5",
        className,
      )}
    >
      <defs>
        <linearGradient id={gradientId} x1="12" y1="4" x2="12" y2="20">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <path
        d="M12 5.25 13.1 8.1 16.2 8.45 13.85 10.45 14.45 13.5 12 12.1 9.55 13.5 10.15 10.45 7.8 8.45 10.9 8.1 12 5.25Z"
        fill="currentColor"
      />

      <path
        d="M4 16.25c2.35-4.35 5.15-6.25 8-6.25s5.65 1.9 8 6.25"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <path
        d="M6.75 15.1c1.55-2.75 3.45-4.1 5.25-4.1s3.7 1.35 5.25 4.1"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M9.25 14.15c1-1.55 2.1-2.35 2.75-2.35s1.75 0.8 2.75 2.35"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

export function AppLogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg",
        "bg-white/10 ring-1 ring-white/15",
        className,
      )}
    >
      <AppLogo size="sm" />
    </span>
  );
}