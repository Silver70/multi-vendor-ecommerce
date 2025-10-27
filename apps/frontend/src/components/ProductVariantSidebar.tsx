"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { variantQueries } from "~/lib/queries";
import { ProductVariant } from "~/types/productVariant";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { ShoppingCart, Search, X } from "lucide-react";

export interface OrderItemInput {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;
}

interface ProductVariantSidebarProps {
  onAddItem: (item: OrderItemInput) => void;
  currentOrderItems?: OrderItemInput[];
}

export function ProductVariantSidebar({
  onAddItem,
  currentOrderItems = [],
}: ProductVariantSidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [recentlyAddedIds, setRecentlyAddedIds] = React.useState<Set<string>>(
    new Set()
  );

  // Sync highlighted items with current order items
  React.useEffect(() => {
    const currentVariantIds = new Set(
      currentOrderItems.map((item) => item.variantId)
    );
    setRecentlyAddedIds(currentVariantIds);
  }, [currentOrderItems]);

  // Fetch all variants
  const { data: allVariants = [], isLoading: isLoadingVariants } = useQuery(
    variantQueries.getAll()
  );

  // Filter variants based on search query
  const filteredVariants = searchQuery
    ? allVariants.filter(
        (v) =>
          v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (v.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ??
            false) ||
          v.productId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allVariants;

  const handleSelectVariant = (variant: ProductVariant) => {
    const itemId = `${Date.now()}-${Math.random()}`;
    onAddItem({
      id: itemId,
      productId: variant.productId,
      productName: variant.productName || "Unknown Product",
      variantId: variant.id,
      variantSku: variant.sku,
      price: variant.price,
      quantity: 1,
      subtotal: variant.price,
      stock: variant.stock,
    });

    // Highlight the added variant
    const newRecentlyAdded = new Set(recentlyAddedIds);
    newRecentlyAdded.add(variant.id);
    setRecentlyAddedIds(newRecentlyAdded);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <ShoppingCart className="h-4 w-4" />
          Browse & Add Products
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[500px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Add Products to Order</SheetTitle>
          <SheetDescription>
            Search and select products to add them to your order
          </SheetDescription>
        </SheetHeader>

        {/* Search Bar */}
        <div className="flex-shrink-0 space-y-2 py-4 border-b">
          <Label htmlFor="variantSearch" className="text-sm font-medium">
            Search Products
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="variantSearch"
              placeholder="Search by product name, SKU, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Variants List */}
        <div className="flex-1 overflow-y-auto py-4">
          {isLoadingVariants ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading products...
            </div>
          ) : filteredVariants.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {searchQuery ? "No products found" : "No products available"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVariants.map((variant) => {
                const isRecentlyAdded = recentlyAddedIds.has(variant.id);
                const isAlreadyInOrder = currentOrderItems.some(
                  (item) => item.variantId === variant.id
                );
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => handleSelectVariant(variant)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isRecentlyAdded
                        ? "border-green-500 bg-green-50 hover:bg-green-100"
                        : "border-transparent bg-muted hover:bg-muted/80"
                    } ${variant.stock === 0 ? "opacity-60" : ""}`}
                    disabled={variant.stock === 0}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {variant.sku}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {variant.productName || "Unknown Product"}
                          </div>
                        </div>
                        {isAlreadyInOrder && (
                          <span className="text-xs font-medium bg-green-500 text-white px-2 py-1 rounded whitespace-nowrap">
                            In Order
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2">
                        <span className="text-sm font-semibold">
                          ${variant.price.toFixed(2)}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            variant.stock > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {variant.stock > 0
                            ? `${variant.stock} in stock`
                            : "Out of stock"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex-shrink-0 border-t pt-4 text-xs text-muted-foreground">
          {searchQuery
            ? `Found ${filteredVariants.length} product(s)`
            : `Showing ${filteredVariants.length} product(s)`}
        </div>
      </SheetContent>
    </Sheet>
  );
}
