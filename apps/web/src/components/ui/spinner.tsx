import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"
import { useI18n } from "@/hooks/useI18n"

type SpinnerProps = React.ComponentProps<"svg"> & {
  size?: number | string
}

function Spinner({ className, size, style, ...props }: SpinnerProps) {
  const dimension = typeof size === "number" ? `${size}px` : size
  const { t } = useI18n()

  return (
    <Loader2Icon
      role="status"
      aria-label={t("Loading")}
      className={cn(size == null && "size-4", "animate-spin", className)}
      style={
        dimension
          ? { ...style, width: dimension, height: dimension }
          : style
      }
      {...props}
    />
  )
}

export { Spinner }
