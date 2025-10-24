"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllProductVariantsQueryOptions } from "~/lib/variantsFn";
import { ProductVariant } from "~/types/productVariant";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export interface OrderItemInput {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface ProductVariantSearchProps {
  onAddItem: (item: OrderItemInput) => void;
  currentOrderItems?: OrderItemInput[];
}

export function ProductVariantSearch({ onAddItem, currentOrderItems = [] }: ProductVariantSearchProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [quantity, setQuantity] = React.useState(1);
  const [recentlyAddedIds, setRecentlyAddedIds] = React.useState<Set<string>>(new Set());
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Sync highlighted items with current order items - only highlight items that are in the order
  React.useEffect(() => {
    const currentVariantIds = new Set(currentOrderItems.map((item) => item.variantId));
    setRecentlyAddedIds(currentVariantIds);
  }, [currentOrderItems]);

  // Fetch all variants without pagination
  const { data: allVariants = [], isLoading: isLoadingVariants } = useQuery(
    getAllProductVariantsQueryOptions()
  );

  // Filter variants based on search query
  const filteredVariants = searchQuery
    ? allVariants.filter(
        (v) =>
          v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (v.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
          v.productId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectVariant = (variant: ProductVariant) => {
    // Immediately add the variant to order items
    if (quantity > variant.stock) {
      return;
    }

    const itemId = `${Date.now()}-${Math.random()}`;
    onAddItem({
      id: itemId,
      productId: variant.productId,
      productName: variant.productName || "Unknown Product",
      variantId: variant.id,
      variantSku: variant.sku,
      price: variant.price,
      quantity,
      subtotal: variant.price * quantity,
    });

    // Highlight the added variant
    const newRecentlyAdded = new Set(recentlyAddedIds);
    newRecentlyAdded.add(variant.id);
    setRecentlyAddedIds(newRecentlyAdded);

    // Reset form
    setSearchQuery("");
    setQuantity(1);
  };

  return (
    <div className="space-y-4">
      {/* Search Input with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Label htmlFor="variantSearch" className="text-sm font-medium">
          Search & Add Products
        </Label>
        <div className="relative mt-2">
          <div className="flex gap-2">
            <Input
              id="variantSearch"
              placeholder="Search by product name, SKU, or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              className="flex-1"
            />
            <div className="flex gap-1 items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </Button>
              <span className="w-10 text-center text-sm font-medium">
                {quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>

          {/* Dropdown List */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-white shadow-lg z-50 max-h-[300px] overflow-y-auto">
              {isLoadingVariants ? (
                <div className="p-3 text-sm text-muted-foreground">
                  Loading variants...
                </div>
              ) : searchQuery && filteredVariants.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  No variants found
                </div>
              ) : (
                <div>
                  {(searchQuery ? filteredVariants : allVariants).map((variant) => {
                    const isRecentlyAdded = recentlyAddedIds.has(variant.id);
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => handleSelectVariant(variant)}
                        className={`w-full text-left p-3 border-b last:border-b-0 transition-colors ${
                          isRecentlyAdded
                            ? "bg-green-100 hover:bg-green-150"
                            : "hover:bg-muted"
                        }`}
                        disabled={quantity > variant.stock}
                      >
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {variant.sku}
                          </div>
                          <div className="flex gap-2 items-center flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {variant.productName || "Unknown Product"}
                            </span>
                            <span className="text-sm font-medium">
                              ${variant.price.toFixed(2)}
                            </span>
                            <span
                              className={`text-xs ${
                                variant.stock > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {variant.stock} in stock
                            </span>
                            {quantity > variant.stock && (
                              <span className="text-xs text-red-600">
                                Only {variant.stock} available
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
