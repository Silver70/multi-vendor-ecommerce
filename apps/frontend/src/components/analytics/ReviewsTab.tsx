"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { StatCard } from "./StatCard";
import { Star, AlertCircle, TrendingUp } from "lucide-react";

interface ReviewsTabProps {
  dateRange: any;
}

export function ReviewsTab({ dateRange }: ReviewsTabProps) {
  const fetch = useAuthenticatedFetch();

  // Fetch review summary
  const { data: reviewSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["analytics", "reviews", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/reviews/summary");
      return res;
    },
  });

  // Fetch rating distribution
  const { data: ratingDistribution, isLoading: ratingLoading } = useQuery({
    queryKey: ["analytics", "reviews", "rating-distribution"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/reviews/rating-distribution");
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch top rated products
  const { data: topRated, isLoading: topLoading } = useQuery({
    queryKey: ["analytics", "reviews", "top-rated"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/reviews/top-rated?limit=10");
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch low rated products
  const { data: lowRated, isLoading: lowLoading } = useQuery({
    queryKey: ["analytics", "reviews", "low-rated"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/reviews/low-rated?limit=10");
      return Array.isArray(res) ? res : [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Review Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Average Rating"
          value={`${reviewSummary?.averageRating?.toFixed(1) || 0}⭐`}
          change={0.3}
          description="vs last month"
          icon={<Star className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
        <StatCard
          title="Total Reviews"
          value={reviewSummary?.totalReviews || 0}
          change={8.2}
          description="vs last month"
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
        <StatCard
          title="Review Coverage"
          value={`${reviewSummary?.reviewCoverage?.toFixed(1) || 0}%`}
          change={2.1}
          description="of products"
          icon={<Star className="h-4 w-4" />}
          isLoading={summaryLoading}
        />
      </div>

      {/* Rating Distribution & Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>5-star breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {ratingLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {ratingDistribution?.map((item: any) => (
                  <div key={item.stars}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">
                        {'⭐'.repeat(item.stars)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Review Summary</CardTitle>
            <CardDescription>Coverage and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm font-medium">Products with Reviews</span>
                  <span className="text-lg font-bold">
                    {reviewSummary?.productsWithReviews || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm font-medium">Products without Reviews</span>
                  <span className="text-lg font-bold text-orange-600">
                    {reviewSummary?.productsWithoutReviews || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Reviews</span>
                  <span className="text-lg font-bold">
                    {reviewSummary?.totalReviews || 0}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top and Low Rated Products */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Rated Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Rated Products</CardTitle>
            <CardDescription>Highest customer satisfaction</CardDescription>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {topRated?.slice(0, 5).map((product: any) => (
                  <div
                    key={product.productId}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {product.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.reviewCount} reviews
                      </p>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      {product.averageRating?.toFixed(1) || 0}⭐
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Rated Products */}
        <Card>
          <CardHeader>
            <CardTitle>Low Rated Products</CardTitle>
            <CardDescription>Need attention</CardDescription>
          </CardHeader>
          <CardContent>
            {lowLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : lowRated && lowRated.length > 0 ? (
              <div className="space-y-3">
                {lowRated?.slice(0, 5).map((product: any) => (
                  <div
                    key={product.productId}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {product.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.reviewCount} reviews
                      </p>
                    </div>
                    <span className="text-sm font-bold text-red-600">
                      {product.averageRating?.toFixed(1) || 0}⭐
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                All products rated well! 🎉
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
