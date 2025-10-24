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
    });

    // Highlight the added variant
    const newRecentlyAdded = new Set(recentlyAddedIds);
    newRecentlyAdded.add(variant.id);
    setRecentlyAddedIds(newRecentlyAdded);

    // Keep search query and dropdown open so user can select more variants
  };

  return (
    <div className="space-y-4">
      {/* Search Input with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Label htmlFor="variantSearch" className="text-sm font-medium">
          Search & Add Products
        </Label>
        <div className="relative mt-2">
          <Input
            id="variantSearch"
            placeholder="Search by product name, SKU, or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            className="w-full"
          />

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
