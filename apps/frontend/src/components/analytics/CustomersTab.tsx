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
import { Users, TrendingUp } from "lucide-react";
import { formatCurrency } from "~/lib/utils";

interface DateRange {
  from: Date;
  to: Date;
}

interface CustomersTabProps {
  dateRange: DateRange;
}

export function CustomersTab({ dateRange }: CustomersTabProps) {
  const fetch = useAuthenticatedFetch();

  // Fetch customer summary
  const { data: customerSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["analytics", "customers", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/customers/summary");
      return res;
    },
  });

  // Fetch customer acquisition
  const { data: acquisition, isLoading: acquisitionLoading } = useQuery({
    queryKey: [
      "analytics",
      "customers",
      "acquisition",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const fromDate = dateRange.from.toISOString().split("T")[0];
      const toDate = dateRange.to.toISOString().split("T")[0];
      const res = await fetch(
        `/api/analytics/customers/acquisition?period=daily&fromDate=${fromDate}&toDate=${toDate}`
      );
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch repeat customer metrics
  const { data: repeatMetrics, isLoading: repeatLoading } = useQuery({
    queryKey: ["analytics", "customers", "repeat"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/customers/repeat");
      return res;
    },
  });

  // Fetch customer lifetime value
  const { data: lifetimeValue, isLoading: lifetimeLoading } = useQuery({
    queryKey: ["analytics", "customers", "lifetime-value"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/customers/lifetime-value?pageSize=10");
      return Array.isArray(res) ? res : [];
    },
  });

  const chartData = acquisition?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    website: item.websiteCustomers,
    admin: item.adminCreatedCustomers,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Customer Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Customers"
          value={customerSummary?.totalCustomers || 0}
          change={5.1}
          description="vs last month"
          icon={<Users className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
        <StatCard
          title="New Customers (This Month)"
          value={customerSummary?.newCustomersThisMonth || 0}
          change={12.3}
          description="vs last month"
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
        <StatCard
          title="Avg Customer Value"
          value={formatCurrency(customerSummary?.averageCustomerValue || 0)}
          change={8.5}
          description="vs last month"
          icon={<Users className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
      </div>

      {/* Customer Acquisition Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Acquisition</CardTitle>
          <CardDescription>New customers by source (Website vs Admin)</CardDescription>
        </CardHeader>
        <CardContent>
          {acquisitionLoading ? (
            <div className="h-[300px] bg-muted animate-pulse rounded" />
          ) : (
            <ChartContainer
              config={{
                website: {
                  label: "Website",
                  color: "hsl(var(--chart-1))",
                },
                admin: {
                  label: "Admin",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                  <Bar dataKey="website" fill="hsl(var(--chart-1))" />
                  <Bar dataKey="admin" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Repeat Customers & Lifetime Value */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Repeat Customer Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Repeat Customer Analysis</CardTitle>
            <CardDescription>Customer retention insights</CardDescription>
          </CardHeader>
          <CardContent>
            {repeatLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm font-medium">Total Customers</span>
                  <span className="text-lg font-bold">{repeatMetrics?.totalCustomers || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm font-medium">One-Time Buyers</span>
                  <span className="text-lg font-bold text-orange-600">
                    {repeatMetrics?.oneTimeCustomers || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm font-medium">Repeat Customers</span>
                  <span className="text-lg font-bold text-green-600">
                    {repeatMetrics?.repeatCustomers || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Repeat Rate</span>
                  <span className="text-lg font-bold">
                    {repeatMetrics?.repeatCustomerRate?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers by Lifetime Value */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers (CLV)</CardTitle>
            <CardDescription>By lifetime value</CardDescription>
          </CardHeader>
          <CardContent>
            {lifetimeLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {lifetimeValue?.slice(0, 5).map((customer: any, idx: number) => (
                  <div key={customer.customerId} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{customer.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.orderCount} orders
                      </p>
                    </div>
                    <span className="text-sm font-bold">
                      {formatCurrency(customer.totalSpent)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Source */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Summary</CardTitle>
          <CardDescription>Overall customer metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Website Customers</p>
              <p className="text-2xl font-bold">{customerSummary?.websiteCustomers || 0}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Admin Created</p>
              <p className="text-2xl font-bold">{customerSummary?.adminCreatedCustomers || 0}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Active Customers</p>
              <p className="text-2xl font-bold">{customerSummary?.activeCustomers || 0}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">New This Week</p>
              <p className="text-2xl font-bold">{customerSummary?.newCustomersThisWeek || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
