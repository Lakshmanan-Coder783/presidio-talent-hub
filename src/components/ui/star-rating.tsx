import * as React from "react"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  max?: number
  className?: string
}

function StarRating({ value, onChange, max = 10, className }: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null)
  const displayValue = hoverValue ?? value

  return (
    <div
      className={cn("flex items-center justify-between w-full", className)}
      onMouseLeave={() => setHoverValue(null)}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map(starValue => (
        <button
          key={starValue}
          type="button"
          onClick={() => onChange(starValue)}
          onMouseEnter={() => setHoverValue(starValue)}
          className="p-1.5 text-muted-foreground hover:scale-110 transition-transform"
          aria-label={`Rate ${starValue} out of ${max}`}
        >
          <Star
            className={cn(
              "h-8 w-8",
              starValue <= displayValue
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  )
}

export { StarRating }
