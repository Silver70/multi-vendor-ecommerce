"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProductVariantsQueryOptions } from "~/lib/variantsFn";
import { ProductVariant } from "~/types/productVariant";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { AlertCircle, Plus } from "lucide-react";
import { Badge } from "~/components/ui/badge";

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
}

export function ProductVariantSearch({ onAddItem }: ProductVariantSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedVariant, setSelectedVariant] =
    React.useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = React.useState(1);

  // Fetch all variants without filters
  const { data: variantsData, isLoading: isLoadingVariants } = useQuery(
    getProductVariantsQueryOptions()
  );

  const allVariants = variantsData?.items || [];

  // Filter variants based on search query
  const filteredVariants = searchQuery
    ? allVariants.filter(
        (v) =>
          v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (v.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
          v.productId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleAddItem = () => {
    if (!selectedVariant) return;

    if (quantity > selectedVariant.stock) {
      return;
    }

    const itemId = `${Date.now()}-${Math.random()}`;
    onAddItem({
      id: itemId,
      productId: selectedVariant.productId,
      productName: selectedVariant.productName || "Unknown Product",
      variantId: selectedVariant.id,
      variantSku: selectedVariant.sku,
      price: selectedVariant.price,
      quantity,
      subtotal: selectedVariant.price * quantity,
    });

    // Reset form
    setSelectedVariant(null);
    setQuantity(1);
    setSearchQuery("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Product to Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Product to Order</DialogTitle>
          <DialogDescription>
            Search for a variant by product name, SKU, or product ID and add it
            to your order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Variant Search */}
          <div className="space-y-2">
            <Label htmlFor="variantSearch">Search Variant *</Label>
            <Input
              id="variantSearch"
              placeholder="Search by product name, SKU, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />

            {searchQuery && (
              <div className="border rounded-md max-h-[250px] overflow-y-auto">
                {isLoadingVariants ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Loading variants...
                  </div>
                ) : filteredVariants.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No variants found
                  </div>
                ) : (
                  <div>
                    {filteredVariants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariant(variant);
                          setSearchQuery("");
                        }}
                        className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0"
                      >
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {variant.productName || "Unknown Product"}
                          </div>
                          <div className="flex gap-2 items-center">
                            <Badge variant="outline" className="text-xs">
                              {variant.sku}
                            </Badge>
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
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Variant Display */}
          {selectedVariant && (
            <div className="p-3 bg-muted rounded-md space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">
                    {selectedVariant.productName || "Unknown Product"}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {selectedVariant.sku}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVariant(null)}
                  className="text-xs text-primary hover:underline"
                >
                  Change
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
                <div>
                  <span className="text-muted-foreground">Price</span>
                  <div className="font-medium">
                    ${selectedVariant.price.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">In Stock</span>
                  <div
                    className={
                      selectedVariant.stock > 0
                        ? "font-medium text-green-600"
                        : "font-medium text-red-600"
                    }
                  >
                    {selectedVariant.stock} units
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Subtotal</span>
                  <div className="font-medium">
                    ${(selectedVariant.price * quantity).toFixed(2)}
                  </div>
                </div>
              </div>

              {selectedVariant.attributes &&
                Object.keys(selectedVariant.attributes).length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Attributes:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedVariant.attributes).map(
                        ([key, value]) => (
                          <Badge
                            key={key}
                            variant="secondary"
                            className="text-xs"
                          >
                            {key}: {value}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Quantity Input */}
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="quantity">Quantity *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    −
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedVariant.stock}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="flex-1 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setQuantity(Math.min(quantity + 1, selectedVariant.stock))
                    }
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Error State */}
              {quantity > selectedVariant.stock && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-800 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">
                    Quantity exceeds available stock ({selectedVariant.stock}{" "}
                    available)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddItem}
              disabled={
                !selectedVariant ||
                quantity <= 0 ||
                quantity > selectedVariant.stock
              }
            >
              Add to Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
