import { cn } from '@/lib/utils'

export function BrandMark({
  className,
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={cn('size-8', className)}
      fill="none"
    >
      <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="3.5" opacity="0.22" />
      <path
        d="M12.5 23.5C12.5 17.15 17.65 12 24 12c4.05 0 7.61 2.09 9.66 5.25"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M35.5 24.5C35.5 30.85 30.35 36 24 36c-4.17 0-7.82-2.21-9.84-5.52"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
