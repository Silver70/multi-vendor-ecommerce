import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Line,
  LineChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";

export const Route = createFileRoute("/dashboard/overview")({
  component: RouteComponent,
});

function RouteComponent() {
  const statsData = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1%",
      trend: "up",
      icon: DollarSign,
      description: "from last month",
    },
    {
      title: "Orders",
      value: "2,350",
      change: "+12.5%",
      trend: "up",
      icon: ShoppingCart,
      description: "from last month",
    },
    {
      title: "Customers",
      value: "1,234",
      change: "+8.2%",
      trend: "up",
      icon: Users,
      description: "from last month",
    },
    {
      title: "Products Sold",
      value: "5,678",
      change: "-3.1%",
      trend: "down",
      icon: Package,
      description: "from last month",
    },
  ];

  const salesData = [
    { month: "Jan", revenue: 4200, orders: 245 },
    { month: "Feb", revenue: 3800, orders: 210 },
    { month: "Mar", revenue: 5100, orders: 290 },
    { month: "Apr", revenue: 4600, orders: 265 },
    { month: "May", revenue: 5900, orders: 340 },
    { month: "Jun", revenue: 6800, orders: 385 },
  ];

  const categoryData = [
    { category: "Electronics", sales: 12500 },
    { category: "Clothing", sales: 9800 },
    { category: "Home & Garden", sales: 7600 },
    { category: "Sports", sales: 6200 },
    { category: "Books", sales: 4100 },
  ];

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold tracking-tight">
                      {stat.value}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
                      )}
                      <p
                        className={`text-xs font-medium ${
                          stat.trend === "up"
                            ? "text-green-600 dark:text-green-500"
                            : "text-red-600 dark:text-red-500"
                        }`}
                      >
                        {stat.change}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  Monthly revenue and order trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="month"
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
              </CardContent>
            </Card>

            {/* Category Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>
                  Top performing product categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    sales: {
                      label: "Sales",
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
                        dataKey="category"
                        className="text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={80}
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
                        dataKey="sales"
                        fill="hsl(var(--chart-2))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest customer orders from your store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: "#3210",
                    customer: "Olivia Martin",
                    product: "Wireless Headphones",
                    amount: "$129.99",
                    status: "Completed",
                  },
                  {
                    id: "#3209",
                    customer: "Jackson Lee",
                    product: "Smart Watch Pro",
                    amount: "$299.99",
                    status: "Processing",
                  },
                  {
                    id: "#3208",
                    customer: "Isabella Nguyen",
                    product: "Laptop Stand",
                    amount: "$49.99",
                    status: "Completed",
                  },
                  {
                    id: "#3207",
                    customer: "William Kim",
                    product: "USB-C Hub",
                    amount: "$79.99",
                    status: "Shipped",
                  },
                  {
                    id: "#3206",
                    customer: "Sofia Davis",
                    product: "Mechanical Keyboard",
                    amount: "$159.99",
                    status: "Completed",
                  },
                ].map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {order.customer}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.product}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{order.amount}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.id}
                        </p>
                      </div>
                      <div
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          order.status === "Completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : order.status === "Processing"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
    </>
  );
}
