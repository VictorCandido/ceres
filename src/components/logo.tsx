import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizes = {
  sm: { icon: 24, text: "text-base" },
  md: { icon: 30, text: "text-xl" },
  lg: { icon: 40, text: "text-2xl" },
}

export function Logo({ size = "md", className }: LogoProps) {
  const { icon, text } = sizes[size]

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect width="64" height="64" rx="12" fill="#2D6A4F" />
        <path
          d="M 36 22 A 13 13 0 1 0 36 42"
          stroke="white"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <rect x="38" y="23" width="16" height="5" rx="2.5" fill="#E9C46A" />
        <rect x="38" y="31" width="11" height="5" rx="2.5" fill="#E9C46A" fillOpacity={0.82} />
        <rect x="38" y="39" width="7"  height="5" rx="2.5" fill="#E9C46A" fillOpacity={0.60} />
      </svg>
      <span className={cn("font-semibold tracking-tight text-emerald-900", text)}>
        ceres
      </span>
    </div>
  )
}
