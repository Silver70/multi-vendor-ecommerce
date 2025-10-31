"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { cn } from "~/lib/utils";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

export type DateRangeType = "today" | "thisWeek" | "thisMonth" | "last30Days" | "custom";

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangeSelector({
  dateRange,
  onDateRangeChange,
}: DateRangeSelectorProps) {
  const [type, setType] = useState<DateRangeType>("thisMonth");
  const [customRange, setCustomRange] = useState<DateRange>(dateRange);

  const today = new Date();

  const getRangeByType = (rangeType: DateRangeType): DateRange => {
    const now = new Date();
    switch (rangeType) {
      case "today":
        return { from: now, to: now };
      case "thisWeek":
        return {
          from: startOfWeek(now),
          to: endOfWeek(now),
        };
      case "thisMonth":
        return {
          from: startOfMonth(now),
          to: endOfMonth(now),
        };
      case "last30Days":
        return {
          from: subDays(now, 30),
          to: now,
        };
      case "custom":
        return customRange;
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  };

  const handleRangeTypeChange = (newType: DateRangeType) => {
    setType(newType);
    if (newType !== "custom") {
      const newRange = getRangeByType(newType);
      onDateRangeChange(newRange);
    }
  };

  const handleCustomDateChange = (field: "from" | "to", date: Date | undefined) => {
    if (!date) return;
    const newRange = { ...customRange, [field]: date };
    setCustomRange(newRange);
    if (type === "custom") {
      onDateRangeChange(newRange);
    }
  };

  const formatDateRange = () => {
    const { from, to } = dateRange;
    if (format(from, "yyyy-MM-dd") === format(to, "yyyy-MM-dd")) {
      return format(from, "MMM dd, yyyy");
    }
    return `${format(from, "MMM dd")} - ${format(to, "MMM dd, yyyy")}`;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={type === "today" ? "default" : "outline"}
        size="sm"
        onClick={() => handleRangeTypeChange("today")}
      >
        Today
      </Button>
      <Button
        variant={type === "thisWeek" ? "default" : "outline"}
        size="sm"
        onClick={() => handleRangeTypeChange("thisWeek")}
      >
        This Week
      </Button>
      <Button
        variant={type === "thisMonth" ? "default" : "outline"}
        size="sm"
        onClick={() => handleRangeTypeChange("thisMonth")}
      >
        This Month
      </Button>
      <Button
        variant={type === "last30Days" ? "default" : "outline"}
        size="sm"
        onClick={() => handleRangeTypeChange("last30Days")}
      >
        Last 30 Days
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={type === "custom" ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Custom
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">From</p>
                <Calendar
                  mode="single"
                  selected={customRange.from}
                  onSelect={(date) => handleCustomDateChange("from", date)}
                  disabled={(date) => date > customRange.to}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">To</p>
                <Calendar
                  mode="single"
                  selected={customRange.to}
                  onSelect={(date) => handleCustomDateChange("to", date)}
                  disabled={(date) => date < customRange.from}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setType("custom");
                  onDateRangeChange(customRange);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="ml-auto text-sm text-muted-foreground">
        {formatDateRange()}
      </div>
    </div>
  );
}
