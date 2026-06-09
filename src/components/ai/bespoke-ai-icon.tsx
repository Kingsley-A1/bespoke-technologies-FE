import { cn } from "@/lib/utils";

type BespokeAIIconProps = {
  className?: string;
  inverse?: boolean;
};

export function BespokeAIIcon({ className, inverse = false }: BespokeAIIconProps) {
  const primary = inverse ? "currentColor" : "#0A84FF";
  const secondary = inverse ? "currentColor" : "#0B1F3A";

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
    >
      <path
        d="M24 5.5 39.2 14v17L24 39.5 8.8 31V14L24 5.5Z"
        stroke={primary}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 18.5h13M17.5 24h13M17.5 29.5h8"
        stroke={secondary}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M33.5 11.5v6.2M39.2 24H43M6 24h3.8M14.5 35.5v-6.2"
        stroke={primary}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="34" cy="29.5" r="3.2" fill={primary} />
      <circle cx="24" cy="24" r="2.6" fill={inverse ? "white" : primary} />
    </svg>
  );
}
