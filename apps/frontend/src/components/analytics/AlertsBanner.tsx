"use client";

import { AlertCircle, AlertTriangle, TrendingDown, Package } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { X } from "lucide-react";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AlertsBannerProps {
  alerts?: Alert[];
  isLoading?: boolean;
}

export function AlertsBanner({ alerts = [], isLoading = false }: AlertsBannerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id));

  if (visibleAlerts.length === 0 && !isLoading) {
    return null;
  }

  const dismissAlert = (id: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(id);
    setDismissedAlerts(newDismissed);
  };

  return (
    <div className="space-y-2">
      {isLoading && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Loading alerts...
            </p>
          </div>
        </Card>
      )}

      {visibleAlerts.map((alert) => {
        const bgColor =
          alert.type === "critical"
            ? "bg-red-50 dark:bg-red-950/30"
            : alert.type === "warning"
              ? "bg-orange-50 dark:bg-orange-950/30"
              : "bg-blue-50 dark:bg-blue-950/30";

        const borderColor =
          alert.type === "critical"
            ? "border-red-200 dark:border-red-800"
            : alert.type === "warning"
              ? "border-orange-200 dark:border-orange-800"
              : "border-blue-200 dark:border-blue-800";

        const textColor =
          alert.type === "critical"
            ? "text-red-800 dark:text-red-200"
            : alert.type === "warning"
              ? "text-orange-800 dark:text-orange-200"
              : "text-blue-800 dark:text-blue-200";

        const iconColor =
          alert.type === "critical"
            ? "text-red-600 dark:text-red-400"
            : alert.type === "warning"
              ? "text-orange-600 dark:text-orange-400"
              : "text-blue-600 dark:text-blue-400";

        const Icon =
          alert.type === "critical"
            ? AlertCircle
            : alert.type === "warning"
              ? AlertTriangle
              : AlertTriangle;

        return (
          <Card
            key={alert.id}
            className={`p-4 border ${bgColor} ${borderColor} flex items-start justify-between gap-4`}
          >
            <div className="flex items-start gap-3 flex-1">
              <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
              <div className="flex-1">
                <p className={`font-medium text-sm ${textColor}`}>{alert.title}</p>
                <p className={`text-sm ${textColor} opacity-90 mt-1`}>
                  {alert.message}
                </p>
                {alert.action && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={alert.action.onClick}
                    className={`h-auto p-0 mt-2 ${
                      alert.type === "critical"
                        ? "text-red-600 dark:text-red-400"
                        : alert.type === "warning"
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {alert.action.label} →
                  </Button>
                )}
              </div>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity`}
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </Card>
        );
      })}
    </div>
  );
}
