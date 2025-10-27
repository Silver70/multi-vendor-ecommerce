import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { productQueries } from "~/lib/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  groupVariantsByFirstAttribute,
  hasMultipleAttributes,
} from "~/lib/utils/variant-grouping";

export const Route = createFileRoute(
  "/dashboard/inventory/products/$productId/"
)({
  beforeLoad(ctx) {
    const { queryClient } = ctx.context;
    const product = queryClient.ensureQueryData(
      productQueries.getById(ctx.params.productId)
    );
    return product;
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data: product } = useQuery(
    productQueries.getById(Route.useParams().productId)
  );

  // State to track which variant groups are expanded
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set()
  );

  const toggleGroupExpansion = (groupValue: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupValue)) {
      newExpanded.delete(groupValue);
    } else {
      newExpanded.add(groupValue);
    }
    setExpandedGroups(newExpanded);
  };

  if (!product) {
    return <div>Loading...</div>;
  }

  // Check if we should show grouped variants
  const shouldGroupVariants =
    product.variants &&
    product.variants.length > 0 &&
    hasMultipleAttributes(product.variants);

  const groupedData = shouldGroupVariants
    ? groupVariantsByFirstAttribute(product.variants)
    : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Image */}
        <div className="w-full">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <img
                src={product.imageUrls[0]}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-muted-foreground text-center p-4">
                <svg
                  className="mx-auto h-12 w-12 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p>No image available</p>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Product info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {product.name}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {product.description || "No description available"}
            </p>
          </div>

          <div className="space-y-2">
            {product.categoryName && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Category:
                </span>
                <Badge variant="secondary">{product.categoryName}</Badge>
              </div>
            )}
            {product.vendorName && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Vendor:
                </span>
                <Badge variant="outline">{product.vendorName}</Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Variants section */}
      <Card>
        <CardHeader>
          <CardTitle>Product Variants</CardTitle>
          <CardDescription>
            Available variants and their stock information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {product.variants && product.variants.length > 0 ? (
            groupedData ? (
              // Grouped variants display (Shopify-style)
              <div className="space-y-2">
                {groupedData.groups.map((group) => (
                  <div key={group.groupValue} className="border rounded-lg">
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroupExpansion(group.groupValue)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${
                            expandedGroups.has(group.groupValue)
                              ? "transform rotate-0"
                              : "transform -rotate-90"
                          }`}
                        />
                        <div className="text-left">
                          <div className="font-semibold">
                            {group.groupAttribute}: {group.groupValue}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {group.variants.length} variant
                            {group.variants.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        $
                        {Math.min(
                          ...group.variants.map((v) => v.price)
                        ).toFixed(2)}{" "}
                        - $
                        {Math.max(
                          ...group.variants.map((v) => v.price)
                        ).toFixed(2)}
                      </div>
                    </button>

                    {/* Group content - variants table */}
                    {expandedGroups.has(group.groupValue) && (
                      <div className="border-t bg-muted/20">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-xs">SKU</TableHead>
                              <TableHead className="text-xs">
                                Attributes
                              </TableHead>
                              <TableHead className="text-right text-xs">
                                Price
                              </TableHead>
                              <TableHead className="text-right text-xs">
                                Stock
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.variants.map((variant) => {
                              const attributes = variant.attributes || {};
                              return (
                                <TableRow key={variant.id}>
                                  <TableCell className="font-medium text-sm">
                                    {variant.sku}
                                  </TableCell>
                                  <TableCell>
                                    {Object.keys(attributes).length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {Object.entries(attributes).map(
                                          ([key, value]) => (
                                            <Badge
                                              key={key}
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {key}: {value}
                                            </Badge>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">
                                        -
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    ${variant.price.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge
                                      variant={
                                        variant.stock > 0
                                          ? "default"
                                          : "destructive"
                                      }
                                    >
                                      {variant.stock}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Flat variants display (no grouping)
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Attributes</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variants.map((variant) => {
                    const attributes = variant.attributes || {};

                    return (
                      <TableRow key={variant.id}>
                        <TableCell className="font-medium">
                          {variant.sku}
                        </TableCell>
                        <TableCell>
                          {Object.keys(attributes).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(attributes).map(
                                ([key, value]) => (
                                  <Badge
                                    key={key}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {key}: {value}
                                  </Badge>
                                )
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          ${variant.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              variant.stock > 0 ? "default" : "destructive"
                            }
                          >
                            {variant.stock}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No variants available for this product
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
