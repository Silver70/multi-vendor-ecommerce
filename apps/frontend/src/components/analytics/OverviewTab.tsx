"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, AlertCircle } from "lucide-react";
import { StatCard } from "./StatCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { formatCurrency } from "~/lib/utils";
import { AlertsBanner } from "./AlertsBanner";

interface DateRange {
  from: Date;
  to: Date;
}

interface OverviewTabProps {
  dateRange: DateRange;
}

export function OverviewTab({ dateRange }: OverviewTabProps) {
  const fetch = useAuthenticatedFetch();

  // Fetch revenue summary
  const { data: revenueSummary, isLoading: revenueLoading } = useQuery({
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

  // Fetch order summary
  const { data: orderSummary, isLoading: ordersLoading } = useQuery({
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
      return res as {
        totalOrders: number;
        pendingOrders: number;
        paidOrders: number;
        shippedOrders: number;
        deliveredOrders: number;
        cancelledOrders: number;
        averageOrderValue: number;
        totalOrderValue: number;
      };
    },
  });

  // Fetch customer summary
  const { data: customerSummary, isLoading: customersLoading } = useQuery({
    queryKey: ["analytics", "customers", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/customers/summary");
      return res as {
        totalCustomers: number;
        websiteCustomers: number;
        adminCreatedCustomers: number;
        activeCustomers: number;
        newCustomersToday: number;
        newCustomersThisWeek: number;
        newCustomersThisMonth: number;
        averageCustomerValue: number;
      };
    },
  });

  // Fetch revenue trends for chart
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

  // Fetch top products
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["analytics", "products", "performance"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/products/performance?pageSize=5");
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch low stock alerts
  const { data: lowStock, isLoading: lowStockLoading } = useQuery({
    queryKey: ["analytics", "inventory", "low-stock"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/inventory/low-stock?threshold=10");
      return Array.isArray(res) ? res : [];
    },
  });

  const alerts = [];

  if (lowStock && lowStock.length > 0) {
    alerts.push({
      id: "low-stock",
      type: "critical" as const,
      title: "Low Stock Alert",
      message: `${lowStock.length} products below reorder threshold`,
      action: {
        label: "View Inventory",
        onClick: () => window.location.href = "/dashboard/inventory/products",
      },
    });
  }

  if (orderSummary && orderSummary.cancelledOrders > 5) {
    alerts.push({
      id: "high-cancellations",
      type: "warning" as const,
      title: "High Cancellation Rate",
      message: `${orderSummary.cancelledOrders} orders cancelled this period`,
      action: {
        label: "View Orders",
        onClick: () => window.location.href = "/dashboard/orders",
      },
    });
  }

  const chartData = revenueTrends?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: item.revenue,
    orders: item.orderCount,
  })) || [];

  const topProductsData = topProducts?.map((product: any) => ({
    name: product.productName.substring(0, 15),
    revenue: product.totalRevenue,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <AlertsBanner alerts={alerts} isLoading={false} />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(revenueSummary?.totalRevenue || 0)}
          change={12.5}
          description="vs last month"
          icon={<DollarSign className="h-4 w-4" />}
          isLoading={revenueLoading}
        />
        <StatCard
          title="Orders"
          value={orderSummary?.totalOrders || 0}
          change={8.2}
          description="vs last month"
          icon={<ShoppingCart className="h-4 w-4" />}
          isLoading={ordersLoading}
        />
        <StatCard
          title="Customers"
          value={customerSummary?.totalCustomers || 0}
          change={5.1}
          description="vs last month"
          icon={<Users className="h-4 w-4" />}
          isLoading={customersLoading}
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(revenueSummary?.averageOrderValue || 0)}
          change={2.1}
          description="vs last month"
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={revenueLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
            ) : (
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "var(--chart-1)",
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
                      dataKey="revenue"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={{ fill: "var(--chart-1)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>By revenue this period</CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
            ) : (
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "var(--chart-2)",
                  },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="name"
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
                    <Bar
                      dataKey="revenue"
                      fill="var(--chart-2)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status Overview</CardTitle>
          <CardDescription>Distribution of orders by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{orderSummary?.pendingOrders || 0}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold">{orderSummary?.paidOrders || 0}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Shipped</p>
              <p className="text-2xl font-bold">{orderSummary?.shippedOrders || 0}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-2xl font-bold">{orderSummary?.deliveredOrders || 0}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Cancelled</p>
              <p className="text-2xl font-bold">{orderSummary?.cancelledOrders || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
