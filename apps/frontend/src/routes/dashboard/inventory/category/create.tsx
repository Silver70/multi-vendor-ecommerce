import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Plus, X, AlertCircle, CheckCircle } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  categoryQueries,
  productQueries,
  useCreateCategory,
  type CreateCategoryDto,
} from "~/lib/queries";
import {
  buildCategoryHierarchy,
  flattenCategoryHierarchy,
} from "~/lib/utils/category-hierarchy";
import { Product } from "~/types/product";

export const Route = createFileRoute("/dashboard/inventory/category/create")({
  component: RouteComponent,
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.prefetchQuery(categoryQueries.getAll());
    queryClient.prefetchQuery(productQueries.getAll());
  },
});

interface CategoryFormData {
  name: string;
  slug: string;
  parentId?: string;
}

function RouteComponent() {
  const navigate = useNavigate();

  // Fetch data
  const { data: categoriesResponse } = useQuery(categoryQueries.getAll());
  const { data: productsResponse } = useQuery(productQueries.getAll());

  const allCategories = categoriesResponse?.items || [];
  const allProducts = productsResponse?.items || [];

  // Build hierarchical category structure for parent selection
  const parentCategoryOptions = useMemo(() => {
    if (allCategories.length === 0) return [];
    const hierarchy = buildCategoryHierarchy(allCategories);
    return flattenCategoryHierarchy(hierarchy);
  }, [allCategories]);

  // Form state
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: "",
      slug: "",
      parentId: "",
    },
  });

  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchProductQuery, setSearchProductQuery] = useState("");

  const createCategoryMutation = useCreateCategory();

  // Auto-generate slug from name
  const nameValue = watch("name");
  const slugValue = watch("slug");

  const generateSlug = (text: string): string => {
    if (!text || text.trim().length === 0) return "";
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // Store the last generated slug to know when user manually edited it
  const [lastGeneratedSlug, setLastGeneratedSlug] = useState("");

  // Update slug when name changes (only if slug is empty or was auto-generated)
  useEffect(() => {
    if (nameValue && nameValue.trim().length > 0) {
      const generatedSlug = generateSlug(nameValue);
      // Only auto-update if slug is empty or hasn't been manually edited
      if (!slugValue || slugValue === lastGeneratedSlug) {
        setValue("slug", generatedSlug);
        setLastGeneratedSlug(generatedSlug);
      }
    }
  }, [nameValue, slugValue, lastGeneratedSlug, setValue]);

  // Filter products for selection
  const availableProducts = allProducts.filter(
    (product) =>
      !selectedProducts.find((p) => p.id === product.id) &&
      product.name.toLowerCase().includes(searchProductQuery.toLowerCase())
  );

  const handleAddProduct = (product: Product) => {
    setSelectedProducts([...selectedProducts, product]);
    setSearchProductQuery("");
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const handleSubmit_ = async (data: CategoryFormData) => {
    const categoryData: CreateCategoryDto = {
      name: data.name,
      slug: data.slug,
      parentId: data.parentId ? data.parentId : undefined,
    };

    createCategoryMutation.mutate(categoryData, {
      onSuccess: () => {
        // Note: Adding products to category would require additional API implementation
        // For now, just redirect to category list
        navigate({ to: "/dashboard/inventory/category" });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Create Category</h1>
        <p className="text-muted-foreground">
          Create a new product category and optionally add products to it
        </p>
      </div>

      <form onSubmit={handleSubmit(handleSubmit_)} className="space-y-6">
        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content - Category Details */}
          <div className="md:col-span-2 space-y-4">
            {/* Category Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category Details</CardTitle>
                <CardDescription>
                  Enter the basic information for your category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Electronics, Clothing"
                    {...register("name", {
                      required: "Category name is required",
                      maxLength: {
                        value: 100,
                        message: "Name cannot exceed 100 characters",
                      },
                    })}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Category Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="e.g., electronics, clothing"
                    {...register("slug", {
                      required: "Slug is required",
                      pattern: {
                        value: /^[a-z0-9-]+$/,
                        message:
                          "Slug must contain only lowercase letters, numbers, and hyphens",
                      },
                      maxLength: {
                        value: 100,
                        message: "Slug cannot exceed 100 characters",
                      },
                    })}
                  />
                  {errors.slug && (
                    <p className="text-sm text-red-600">
                      {errors.slug.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Auto-generated from category name. Used in URLs for SEO.
                  </p>
                </div>

                {/* Parent Category */}
                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent Category (Optional)</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("parentId", value || "")
                    }
                  >
                    <SelectTrigger id="parentId">
                      <SelectValue placeholder="No parent (top-level category)" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentCategoryOptions.length > 0 ? (
                        parentCategoryOptions.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <span className="font-mono">
                              {category.displayName}
                            </span>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No parent categories available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a parent to create a subcategory. Leave empty for a
                    top-level category.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Add Products Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Products</CardTitle>
                <CardDescription>
                  Optional: Add existing products to this category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Search */}
                <div className="space-y-2">
                  <Label htmlFor="product-search">Search Products</Label>
                  <Input
                    id="product-search"
                    placeholder="Search by product name..."
                    value={searchProductQuery}
                    onChange={(e) => setSearchProductQuery(e.target.value)}
                  />
                </div>

                {/* Available Products Dropdown */}
                {searchProductQuery && availableProducts.length > 0 && (
                  <div className="border rounded-md max-h-64 overflow-y-auto">
                    {availableProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border-b hover:bg-muted cursor-pointer"
                        onClick={() => handleAddProduct(product)}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.categoryName || "No category"}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}

                {searchProductQuery && availableProducts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {selectedProducts.length === allProducts.length
                      ? "All products already added"
                      : "No products found"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Selected Products Card */}
            {selectedProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Selected Products ({selectedProducts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-md"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.categoryName || "No category"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveProduct(product.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Summary */}
          <div className="md:col-span-1 space-y-4">
            {/* Category Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category Name</p>
                  <p className="font-medium text-sm">
                    {nameValue || "Not entered"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Slug</p>
                  <p className="font-medium text-sm">
                    {watch("slug") || "Auto-generated"}
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Products to Add
                  </p>
                  <Badge variant="secondary">
                    {selectedProducts.length} selected
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  Products are optional. You can add them later from the
                  category management page.
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createCategoryMutation.isPending}
                className="flex-1"
              >
                {createCategoryMutation.isPending
                  ? "Creating..."
                  : "Create Category"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate({ to: "/dashboard/inventory/category" })
                }
                disabled={createCategoryMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {createCategoryMutation.isError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-800 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              {createCategoryMutation.error instanceof Error
                ? createCategoryMutation.error.message
                : "Failed to create category. Please try again."}
            </p>
          </div>
        )}

        {/* Success Message */}
        {createCategoryMutation.isSuccess && (
          <div className="rounded-md bg-green-50 border border-green-200 p-4 flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-800 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              Category created successfully! Redirecting...
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
