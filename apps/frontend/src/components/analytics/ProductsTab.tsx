"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  BarChart,
  Bar,
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
import { Package, AlertCircle, TrendingUp } from "lucide-react";
import { formatCurrency } from "~/lib/utils";
import { AlertsBanner } from "./AlertsBanner";

interface DateRange {
  from: Date;
  to: Date;
}

interface ProductsTabProps {
  dateRange: DateRange;
}

export function ProductsTab({ dateRange }: ProductsTabProps) {
  const fetch = useAuthenticatedFetch();

  // Fetch top products
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["analytics", "products", "performance"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/products/performance?pageSize=10");
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch category sales
  const { data: categorySales, isLoading: categoryLoading } = useQuery({
    queryKey: [
      "analytics",
      "categories",
      "sales",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ],
    queryFn: async () => {
      const fromDate = dateRange.from.toISOString().split("T")[0];
      const toDate = dateRange.to.toISOString().split("T")[0];
      const res = await fetch(
        `/api/analytics/categories/sales?fromDate=${fromDate}&toDate=${toDate}`
      );
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch inventory levels
  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ["analytics", "inventory", "levels"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/inventory/levels?pageSize=5");
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

  const categoryData = categorySales?.map((cat: any) => ({
    name: cat.categoryName.substring(0, 15),
    revenue: cat.totalRevenue,
  })) || [];

  const alerts = lowStock && lowStock.length > 0 ? [{
    id: "low-stock",
    type: "critical" as const,
    title: "Low Stock Alert",
    message: `${lowStock.length} products below reorder threshold. Immediate action recommended.`,
    action: {
      label: "Manage Inventory",
      onClick: () => window.location.href = "/dashboard/inventory/products",
    },
  }] : [];

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <AlertsBanner alerts={alerts} />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={topProducts?.length || 0}
          change={3.2}
          description="active products"
          icon={<Package className="h-4 w-4" />}
          isLoading={productsLoading}
        />
        <StatCard
          title="Categories"
          value={categorySales?.length || 0}
          change={0}
          description="in catalog"
          icon={<Package className="h-4 w-4" />}
          isLoading={categoryLoading}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStock?.length || 0}
          change={-5.1}
          description="need reorder"
          icon={<AlertCircle className="h-4 w-4" />}
          isLoading={lowStockLoading}
        />
        <StatCard
          title="Best Seller"
          value={topProducts?.[0]?.unitsSold || 0}
          change={8.3}
          description="units sold"
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={productsLoading}
        />
      </div>

      {/* Category Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Category Sales Performance</CardTitle>
          <CardDescription>Revenue by category</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryLoading ? (
            <div className="h-[300px] bg-muted animate-pulse rounded" />
          ) : (
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
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
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Products & Low Stock */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>By units sold</CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts?.slice(0, 5).map((product: any) => (
                  <div key={product.productId} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {product.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ⭐ {product.averageRating?.toFixed(1) || 0} ({product.reviewCount})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{product.unitsSold}</p>
                      <p className="text-xs text-green-600">
                        {formatCurrency(product.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Products needing reorder</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : lowStock && lowStock.length > 0 ? (
              <div className="space-y-3">
                {lowStock?.slice(0, 5).map((item: any) => (
                  <div key={item.variantId} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {item.currentStock} | Selling: {item.recentSalesPerDay}/day
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {item.daysUntilStockout} days
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.sku}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No items below threshold
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Summary</CardTitle>
          <CardDescription>Current stock levels and status</CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {inventory?.map((item: any) => (
                <div key={item.variantId} className="flex justify-between items-center pb-3 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{item.currentStock} units</p>
                    <p className="text-xs text-muted-foreground">
                      Value: {formatCurrency(item.stockValue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
