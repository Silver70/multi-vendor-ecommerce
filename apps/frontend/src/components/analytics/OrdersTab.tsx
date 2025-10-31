"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  BarChart,
  Bar,
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
import { ShoppingCart, TrendingUp, AlertCircle } from "lucide-react";

interface DateRange {
  from: Date;
  to: Date;
}

interface OrdersTabProps {
  dateRange: DateRange;
}

export function OrdersTab({ dateRange }: OrdersTabProps) {
  const fetch = useAuthenticatedFetch();

  // Fetch order summary
  const { data: orderSummary, isLoading: summaryLoading } = useQuery({
    queryKey: [
      "analytics",
      "orders",
      "summary",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const fromDate = dateRange.from.toISOString().split("T")[0];
      const toDate = dateRange.to.toISOString().split("T")[0];
      const res = await fetch(
        `/api/analytics/orders/summary?fromDate=${fromDate}&toDate=${toDate}`
      );
      return res;
    },
  });

  // Fetch order trends
  const { data: orderTrends, isLoading: trendsLoading } = useQuery({
    queryKey: [
      "analytics",
      "orders",
      "trends",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const fromDate = dateRange.from.toISOString().split("T")[0];
      const toDate = dateRange.to.toISOString().split("T")[0];
      const res = await fetch(
        `/api/analytics/orders/trends?period=daily&fromDate=${fromDate}&toDate=${toDate}`
      );
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch order status breakdown
  const { data: statusBreakdown, isLoading: statusLoading } = useQuery({
    queryKey: [
      "analytics",
      "orders",
      "status-breakdown",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const fromDate = dateRange.from.toISOString().split("T")[0];
      const toDate = dateRange.to.toISOString().split("T")[0];
      const res = await fetch(
        `/api/analytics/orders/status-breakdown?fromDate=${fromDate}&toDate=${toDate}`
      );
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch conversion funnel
  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: [
      "analytics",
      "orders",
      "conversion-funnel",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const fromDate = dateRange.from.toISOString().split("T")[0];
      const toDate = dateRange.to.toISOString().split("T")[0];
      const res = await fetch(
        `/api/analytics/orders/conversion-funnel?fromDate=${fromDate}&toDate=${toDate}`
      );
      return Array.isArray(res) ? res : [];
    },
  });

  const chartData = orderTrends?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    orders: item.orderCount,
    amount: item.totalAmount,
  })) || [];

  const funnelData = funnel?.map((item: any) => ({
    stage: item.stage,
    count: item.count,
    percentage: item.percentage,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Order Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Orders"
          value={orderSummary?.totalOrders || 0}
          change={8.2}
          description="vs last month"
          icon={<ShoppingCart className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
        <StatCard
          title="Completed Orders"
          value={orderSummary?.deliveredOrders || 0}
          change={12.5}
          description="vs last month"
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
        <StatCard
          title="Cancelled Orders"
          value={orderSummary?.cancelledOrders || 0}
          change={-2.1}
          description="vs last month"
          icon={<AlertCircle className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
      </div>

      {/* Order Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Order Trends</CardTitle>
          <CardDescription>Daily orders and value over selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="h-[300px] bg-muted animate-pulse rounded" />
          ) : (
            <ChartContainer
              config={{
                orders: {
                  label: "Orders",
                  color: "hsl(var(--chart-1))",
                },
                amount: {
                  label: "Amount",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-1))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Order Status and Conversion Funnel */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Breakdown</CardTitle>
            <CardDescription>Current order distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {statusBreakdown?.map((item: any) => (
                  <div key={item.status}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{item.status}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Order journey conversion rates</CardDescription>
          </CardHeader>
          <CardContent>
            {funnelLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {funnelData.map((item: any, index: number) => (
                  <div key={item.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.stage}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full`}
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: [
                            "hsl(var(--chart-1))",
                            "hsl(var(--chart-2))",
                            "hsl(var(--chart-3))",
                            "hsl(var(--chart-4))",
                          ][index],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Status Overview Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>Detailed order metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{orderSummary?.pendingOrders || 0}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold">{orderSummary?.paidOrders || 0}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-2xl font-bold">{orderSummary?.deliveredOrders || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
