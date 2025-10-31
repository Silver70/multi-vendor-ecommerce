"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { StatCard } from "./StatCard";
import { CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "~/lib/utils";

interface DateRange {
  from: Date;
  to: Date;
}

interface PaymentsTabProps {
  dateRange: DateRange;
}

export function PaymentsTab({ dateRange }: PaymentsTabProps) {
  const fetch = useAuthenticatedFetch();

  // Fetch payment summary
  const { data: paymentSummary, isLoading: summaryLoading } = useQuery({
    queryKey: [
      "analytics",
      "payments",
      "summary",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const fromDate = dateRange.from.toISOString().split("T")[0];
      const toDate = dateRange.to.toISOString().split("T")[0];
      const res = await fetch(
        `/api/analytics/payments/summary?fromDate=${fromDate}&toDate=${toDate}`
      );
      return res;
    },
  });

  // Fetch payment trends
  const { data: paymentTrends, isLoading: trendsLoading } = useQuery({
    queryKey: [
      "analytics",
      "payments",
      "trends",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const fromDate = dateRange.from.toISOString().split("T")[0];
      const toDate = dateRange.to.toISOString().split("T")[0];
      const res = await fetch(
        `/api/analytics/payments/trends?period=daily&fromDate=${fromDate}&toDate=${toDate}`
      );
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch payment by method
  const { data: paymentByMethod, isLoading: methodLoading } = useQuery({
    queryKey: [
      "analytics",
      "payments",
      "by-method",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const fromDate = dateRange.from.toISOString().split("T")[0];
      const toDate = dateRange.to.toISOString().split("T")[0];
      const res = await fetch(
        `/api/analytics/payments/by-method?fromDate=${fromDate}&toDate=${toDate}`
      );
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch refund metrics
  const { data: refundMetrics, isLoading: refundLoading } = useQuery({
    queryKey: ["analytics", "payments", "refund-metrics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/payments/refund-metrics");
      return res;
    },
  });

  const chartData = paymentTrends?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    completed: item.completedAmount,
    failed: item.failedAmount,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Success Rate"
          value={`${paymentSummary?.successRate?.toFixed(1) || 0}%`}
          change={paymentSummary?.successRate && paymentSummary.successRate > 90 ? 2.1 : -1.5}
          description="vs last month"
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
        <StatCard
          title="Total Processed"
          value={formatCurrency(paymentSummary?.totalProcessed || 0)}
          change={12.5}
          description="vs last month"
          icon={<CreditCard className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
        <StatCard
          title="Failed Payments"
          value={paymentSummary?.failedPayments || 0}
          change={paymentSummary?.failureRate || 0}
          description="this period"
          icon={<AlertCircle className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
      </div>

      {/* Payment Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Trends</CardTitle>
          <CardDescription>Completed vs failed payments over time</CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          {trendsLoading ? (
            <div className="h-[300px] bg-muted animate-pulse rounded" />
          ) : (
            <ChartContainer
              config={{
                completed: {
                  label: "Completed",
                  color: "var(--chart-1)",
                },
                failed: {
                  label: "Failed",
                  color: "var(--chart-3)",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "var(--foreground)" }}
                    stroke="var(--border)"
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "var(--foreground)" }}
                    stroke="var(--border)"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ fill: "var(--chart-1)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    dot={{ fill: "var(--chart-3)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods & Refund Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Performance by method</CardDescription>
          </CardHeader>
          <CardContent>
            {methodLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paymentByMethod?.map((method: any) => (
                  <div key={method.paymentMethod} className="pb-4 border-b last:border-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium capitalize">
                        {method.paymentMethod}
                      </span>
                      <span className="text-sm font-bold">
                        {formatCurrency(method.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{method.transactionCount} transactions</span>
                      <span className="text-green-600">
                        Success: {method.successRate?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refund Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Refund Analysis</CardTitle>
            <CardDescription>Refund trends and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {refundLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm font-medium">Total Refunds</span>
                  <span className="text-lg font-bold">
                    {refundMetrics?.totalRefunds || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm font-medium">Refund Rate</span>
                  <span className="text-lg font-bold text-orange-600">
                    {refundMetrics?.refundRate?.toFixed(2) || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm font-medium">Total Refunded</span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(refundMetrics?.totalRefundedAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg Refund</span>
                  <span className="text-sm font-bold">
                    {formatCurrency(refundMetrics?.averageRefundAmount || 0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <CardDescription>Overall payment statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Completed Payments</p>
              <p className="text-2xl font-bold">{paymentSummary?.completedPayments || 0}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Pending Payments</p>
              <p className="text-2xl font-bold">{paymentSummary?.pendingPayments || 0}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Failed Payments</p>
              <p className="text-2xl font-bold">{paymentSummary?.failedPayments || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
