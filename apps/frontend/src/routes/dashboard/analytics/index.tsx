"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { DateRangeSelector } from "~/components/analytics/DateRangeSelector";
import { OverviewTab } from "~/components/analytics/OverviewTab";
import { RevenueTab } from "~/components/analytics/RevenueTab";
import { OrdersTab } from "~/components/analytics/OrdersTab";
import { CustomersTab } from "~/components/analytics/CustomersTab";
import { ProductsTab } from "~/components/analytics/ProductsTab";
import { ReviewsTab } from "~/components/analytics/ReviewsTab";
import { PaymentsTab } from "~/components/analytics/PaymentsTab";
import { endOfMonth, startOfMonth } from "date-fns";

export const Route = createFileRoute("/dashboard/analytics/")({
  component: RouteComponent,
});

function RouteComponent() {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(today),
    to: endOfMonth(today),
  });
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your store performance and key metrics at a glance
        </p>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <OverviewTab dateRange={dateRange} />
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <RevenueTab dateRange={dateRange} />
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <OrdersTab dateRange={dateRange} />
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <CustomersTab dateRange={dateRange} />
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <ProductsTab dateRange={dateRange} />
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <ReviewsTab dateRange={dateRange} />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <PaymentsTab dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
