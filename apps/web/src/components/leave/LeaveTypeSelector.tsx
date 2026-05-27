import { BriefcaseBusiness, HeartPulse } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { LeaveRequestType } from "@/services/api/leaveRequestApi";
import { useI18n } from "@/hooks/useI18n";

type LeaveTypeSelectorProps = {
  value: LeaveRequestType | "";
  onChange: (value: LeaveRequestType) => void;
  disabled?: boolean;
};

export function LeaveTypeSelector({
  value,
  onChange,
  disabled,
}: LeaveTypeSelectorProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <Label>{t("Leave type")}</Label>
      <Select
        value={value}
        onValueChange={(next) => onChange(next as LeaveRequestType)}
        disabled={disabled}
      >
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder={t("Choose leave type")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="VACATION">
            <BriefcaseBusiness className="h-4 w-4 text-blue-500" />
            {t("Vacation leave")}
          </SelectItem>
          <SelectItem value="SICK">
            <HeartPulse className="h-4 w-4 text-rose-500" />
            {t("Sick leave")}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
