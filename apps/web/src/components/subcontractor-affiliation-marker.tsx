import { Handshake } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type SubcontractorAffiliationMarkerProps = {
  className?: string;
};

export function SubcontractorAffiliationMarker({
  className,
}: SubcontractorAffiliationMarkerProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label="Subcontractor worker"
          className={cn(
            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground",
            className,
          )}
        >
          <Handshake className="h-3 w-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent>Subcontractor worker</TooltipContent>
    </Tooltip>
  );
}
