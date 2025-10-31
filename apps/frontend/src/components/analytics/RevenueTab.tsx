"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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
import { formatCurrency } from "~/lib/utils";
import { StatCard } from "./StatCard";
import { DollarSign, TrendingUp } from "lucide-react";

interface DateRange {
  from: Date;
  to: Date;
}

interface RevenueTabProps {
  dateRange: DateRange;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function RevenueTab({ dateRange }: RevenueTabProps) {
  const fetch = useAuthenticatedFetch();

  // Fetch revenue summary
  const { data: revenueSummary, isLoading: summaryLoading } = useQuery({
    queryKey: [
      "analytics",
      "revenue",
      "summary",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const fromDate = dateRange.from.toISOString().split("T")[0];
      const toDate = dateRange.to.toISOString().split("T")[0];
      const res = await fetch(
        `/api/analytics/revenue/summary?fromDate=${fromDate}&toDate=${toDate}`
      );
      return res as {
        totalRevenue: number;
        pendingRevenue: number;
        completedRevenue: number;
        refundedAmount: number;
        totalOrders: number;
        averageOrderValue: number;
      };
    },
  });

  // Fetch revenue trends
  const { data: revenueTrends, isLoading: trendsLoading } = useQuery({
    queryKey: [
      "analytics",
      "revenue",
      "trends",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const fromDate = dateRange.from.toISOString().split("T")[0];
      const toDate = dateRange.to.toISOString().split("T")[0];
      const res = await fetch(
        `/api/analytics/revenue/trends?period=daily&fromDate=${fromDate}&toDate=${toDate}`
      );
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch revenue by status
  const { data: revenueByStatus, isLoading: statusLoading } = useQuery({
    queryKey: [
      "analytics",
      "revenue",
      "by-status",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const fromDate = dateRange.from.toISOString().split("T")[0];
      const toDate = dateRange.to.toISOString().split("T")[0];
      const res = await fetch(
        `/api/analytics/revenue/by-status?fromDate=${fromDate}&toDate=${toDate}`
      );
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch revenue by category
  const { data: revenueByCategory, isLoading: categoryLoading } = useQuery({
    queryKey: [
      "analytics",
      "revenue",
      "by-category",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const fromDate = dateRange.from.toISOString().split("T")[0];
      const toDate = dateRange.to.toISOString().split("T")[0];
      const res = await fetch(
        `/api/analytics/revenue/by-category?fromDate=${fromDate}&toDate=${toDate}`
      );
      return Array.isArray(res) ? res : [];
    },
  });

  const chartData = revenueTrends?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: item.revenue,
  })) || [];

  const statusData = revenueByStatus?.map((item: any) => ({
    name: item.category,
    value: item.revenue,
  })) || [];

  const categoryData = revenueByCategory?.map((item: any) => ({
    name: item.category,
    value: item.revenue,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Revenue Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(revenueSummary?.totalRevenue || 0)}
          change={12.5}
          description="vs last month"
          icon={<DollarSign className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
        <StatCard
          title="Completed Revenue"
          value={formatCurrency(revenueSummary?.completedRevenue || 0)}
          change={15.2}
          description="vs last month"
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
        <StatCard
          title="Pending Revenue"
          value={formatCurrency(revenueSummary?.pendingRevenue || 0)}
          change={-5.1}
          description="vs last month"
          icon={<DollarSign className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Daily revenue over selected period</CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          {trendsLoading ? (
            <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
          ) : (
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
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
                    dataKey="revenue"
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

      {/* Revenue by Status and Category */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Status</CardTitle>
            <CardDescription>Payment status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="w-full">
            {statusLoading ? (
              <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
            ) : (
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>Top performing categories</CardDescription>
          </CardHeader>
          <CardContent className="w-full">
            {categoryLoading ? (
              <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
            ) : (
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Summary</CardTitle>
          <CardDescription>Detailed breakdown of revenue metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Total Orders</span>
              <span className="text-sm">{revenueSummary?.totalOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Average Order Value</span>
              <span className="text-sm">
                {formatCurrency(revenueSummary?.averageOrderValue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Completed Revenue</span>
              <span className="text-sm text-green-600">
                {formatCurrency(revenueSummary?.completedRevenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Pending Revenue</span>
              <span className="text-sm text-yellow-600">
                {formatCurrency(revenueSummary?.pendingRevenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Refunded Amount</span>
              <span className="text-sm text-red-600">
                {formatCurrency(revenueSummary?.refundedAmount || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
