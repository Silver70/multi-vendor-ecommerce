"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProductsQueryOptions, getProduct } from "~/lib/productFn";
import { Product, ProductDetails } from "~/types/product";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { AlertCircle, Plus } from "lucide-react";

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
  const [selectedProductId, setSelectedProductId] = React.useState<
    string | null
  >(null);
  const [selectedVariantId, setSelectedVariantId] = React.useState<
    string | null
  >(null);
  const [quantity, setQuantity] = React.useState(1);

  const { data: productsData, isLoading: isLoadingProducts } = useQuery(
    getProductsQueryOptions
  );

  const { data: selectedProductDetails, isLoading: isLoadingProduct } =
    useQuery<ProductDetails | undefined>(
      selectedProductId
        ? {
            queryKey: ["products", selectedProductId],
            queryFn: async () => {
              const result = await getProduct({ data: selectedProductId });
              return result as ProductDetails;
            },
          }
        : {
            queryKey: ["products", "null"],
            queryFn: async () => undefined,
            enabled: false,
          }
    );

  const products = productsData?.items || [];

  const filteredProducts = searchQuery
    ? products.filter(
        (p: Product) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  const variants = selectedProductDetails?.variants || [];

  const handleAddItem = () => {
    if (!selectedVariantId || !selectedProductDetails) return;

    const variant = variants.find((v) => v.id === selectedVariantId);
    if (!variant) return;

    if (quantity > variant.stock) {
      return;
    }

    const itemId = `${Date.now()}-${Math.random()}`;
    onAddItem({
      id: itemId,
      productId: selectedProductDetails.id,
      productName: selectedProductDetails.name,
      variantId: variant.id,
      variantSku: variant.sku,
      price: variant.price,
      quantity,
      subtotal: variant.price * quantity,
    });

    // Reset form
    setSelectedProductId(null);
    setSelectedVariantId(null);
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
            Search for a product and select a variant to add to the order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Search */}
          <div className="space-y-2">
            <Label htmlFor="productSearch">Search Product *</Label>
            <Input
              id="productSearch"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {searchQuery && (
              <div className="border rounded-md max-h-[200px] overflow-y-auto">
                {isLoadingProducts ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Loading products...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No products found
                  </div>
                ) : (
                  <div>
                    {filteredProducts.map((product: Product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          setSelectedProductId(product.id);
                          setSearchQuery("");
                        }}
                        className="w-full text-left p-2 hover:bg-muted transition-colors border-b last:border-b-0"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {product.categoryName} • {product.vendorName}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Product Display */}
          {selectedProductDetails && (
            <>
              <div className="p-3 bg-muted rounded-md">
                <div className="font-medium text-sm">
                  {selectedProductDetails.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedProductDetails.description}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductId(null)}
                  className="text-xs text-primary hover:underline mt-2"
                >
                  Change product
                </button>
              </div>

              {/* Variant Selection */}
              <div className="space-y-2">
                <Label htmlFor="variantSelect">Select Variant *</Label>
                <Select
                  value={selectedVariantId || ""}
                  onValueChange={setSelectedVariantId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a variant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingProduct ? (
                      <SelectItem value="loading" disabled>
                        Loading variants...
                      </SelectItem>
                    ) : variants.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No variants available
                      </SelectItem>
                    ) : (
                      variants.map((variant: any) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          <div className="flex items-center gap-2">
                            <span>SKU: {variant.sku}</span>
                            <span className="text-muted-foreground">•</span>
                            <span>${variant.price.toFixed(2)}</span>
                            <span className="text-muted-foreground">•</span>
                            <span
                              className={
                                variant.stock > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {variant.stock} in stock
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Variant Details */}
              {selectedVariantId && (
                <div className="p-3 bg-muted rounded-md space-y-2">
                  {(() => {
                    const variant = variants.find(
                      (v: any) => v.id === selectedVariantId
                    );
                    if (!variant) return null;
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">SKU:</span>
                            <div className="font-medium">{variant.sku}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Price:
                            </span>
                            <div className="font-medium">
                              ${variant.price.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              In Stock:
                            </span>
                            <div
                              className={
                                variant.stock > 0
                                  ? "font-medium text-green-600"
                                  : "font-medium text-red-600"
                              }
                            >
                              {variant.stock} units
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Subtotal:
                            </span>
                            <div className="font-medium">
                              ${(variant.price * quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {variant.attributes &&
                          Object.keys(variant.attributes).length > 0 && (
                            <div className="pt-2 border-t">
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                Attributes:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(variant.attributes).map(
                                  ([key, value]) => (
                                    <span
                                      key={key}
                                      className="text-xs bg-background px-2 py-1 rounded"
                                    >
                                      {key}: {value}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Quantity Input */}
              {selectedVariantId && (
                <div className="space-y-2">
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
                      max={
                        variants.find((v: any) => v.id === selectedVariantId)
                          ?.stock || 1
                      }
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
                        setQuantity(
                          Math.min(
                            quantity + 1,
                            variants.find((v: any) => v.id === selectedVariantId)
                              ?.stock || 999
                          )
                        )
                      }
                    >
                      +
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Max available:{" "}
                    {variants.find((v: any) => v.id === selectedVariantId)?.stock}{" "}
                    units
                  </div>
                </div>
              )}
            </>
          )}

          {/* Error State */}
          {selectedVariantId &&
            quantity >
              (variants.find((v: any) => v.id === selectedVariantId)?.stock ||
                0) && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-red-800 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  Quantity exceeds available stock
                </p>
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
                !selectedVariantId ||
                quantity <= 0 ||
                quantity >
                  (variants.find((v: any) => v.id === selectedVariantId)
                    ?.stock || 0)
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
