"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "~/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  description?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  change,
  description,
  icon,
  isLoading = false,
  onClick,
}: StatCardProps) {
  const isPositive = change && change >= 0;
  const hasChange = change !== undefined && change !== null;

  return (
    <Card
      className={cn("hover:shadow-lg transition-all", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 bg-muted animate-pulse rounded" />
        ) : (
          <>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            {hasChange && (
              <div className="flex items-center gap-1 mt-1">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
                )}
                <p
                  className={cn(
                    "text-xs font-medium",
                    isPositive
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500"
                  )}
                >
                  {isPositive ? "+" : ""}{change}%
                </p>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
