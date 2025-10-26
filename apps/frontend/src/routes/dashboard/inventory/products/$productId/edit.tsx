import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Plus, X, Trash2, Loader2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { CustomSelect } from "~/components/ui/custom-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

import {
  productQueries,
  categoryQueries,
  vendorQueries,
  attributeQueries,
  useUpdateProduct,
  type CreateCompositeProductDto,
  type VariantInput,
  type GlobalAttribute,
} from "~/lib/queries";
import {
  buildCategoryHierarchy,
  flattenCategoryHierarchy,
} from "~/lib/utils/category-hierarchy";

export const Route = createFileRoute(
  "/dashboard/inventory/products/$productId/edit"
)({
  component: RouteComponent,
  loader: ({ context, params }) => {
    const { queryClient } = context;
    queryClient.prefetchQuery(productQueries.getById(params.productId));
    queryClient.prefetchQuery(categoryQueries.getAll());
    queryClient.prefetchQuery(vendorQueries.getAll());
    queryClient.prefetchQuery(attributeQueries.getAll());
  },
});

interface AttributeValue {
  id: string;
  value: string;
}

interface Attribute {
  id: string;
  name: string;
  values: AttributeValue[];
}

interface ProductFormData {
  productName: string;
  description: string;
  categoryId: string;
  vendorId: string;
  basePrice: string;
  isActive: boolean;
}

function RouteComponent() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery(productQueries.getById(productId));
  const { data: categoriesResponse } = useQuery(categoryQueries.getAll());
  const { data: vendorsResponse } = useQuery(vendorQueries.getAll());
  const { data: globalAttributes } = useQuery(attributeQueries.getAll());

  const categories = categoriesResponse?.items || [];
  const vendors = vendorsResponse?.items || [];
  const availableGlobalAttributes = globalAttributes || [];

  // Build hierarchical category structure
  const categoryHierarchy = React.useMemo(() => {
    if (categories.length === 0) return [];
    const hierarchy = buildCategoryHierarchy(categories);
    return flattenCategoryHierarchy(hierarchy);
  }, [categories]);

  // React Hook Form - replaces 6 useState calls
  const { register, watch, setValue, handleSubmit } = useForm<ProductFormData>({
    defaultValues: {
      productName: "",
      description: "",
      categoryId: "",
      vendorId: "",
      basePrice: "",
      isActive: true,
    },
  });

  // Watch all form fields
  const productName = watch("productName");
  const description = watch("description");
  const categoryId = watch("categoryId");
  const vendorId = watch("vendorId");
  const basePrice = watch("basePrice");
  const isActive = watch("isActive");

  // Attributes and Variants State (complex nested state, kept in React.useState)
  const [attributes, setAttributes] = React.useState<Attribute[]>([]);
  const [newAttributeName, setNewAttributeName] = React.useState("");
  const [newAttributeValue, setNewAttributeValue] = React.useState("");
  const [variants, setVariants] = React.useState<VariantInput[]>([]);

  // Initialize form with product data - load immediately when product arrives
  React.useEffect(() => {
    if (product) {
      setValue("productName", product.name);
      setValue("description", product.description || "");
      setValue("isActive", product.isActive);
      const variantPrice = (product.variants?.[0]?.price || 0).toString();
      setValue("basePrice", variantPrice);

      // Load attributes
      const loadedAttributes: Attribute[] = (product.attributes || []).map(
        (attr) => ({
          id: Math.random().toString(36).substring(2, 11),
          name: attr.name,
          values: attr.values.map((v) => ({
            id: Math.random().toString(36).substring(2, 11),
            value: v,
          })),
        })
      );
      setAttributes(loadedAttributes);

      // Load variants
      const loadedVariants: VariantInput[] = (product.variants || []).map(
        (v) => ({
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          attributes: v.attributes || {},
        })
      );
      setVariants(loadedVariants);
    }
  }, [product, setValue]);

  // Set category and vendor AFTER the dropdowns have loaded with data
  React.useEffect(() => {
    if (product && categoryHierarchy.length > 0 && vendors.length > 0) {
      console.log("Setting form values:", {
        categoryId: product.categoryId,
        vendorId: product.vendorId,
        productName: product.name,
      });
      console.log(
        "Available categories:",
        categoryHierarchy.map((c) => ({ id: c.id, name: c.name }))
      );
      console.log(
        "Available vendors:",
        vendors.map((v) => ({ id: v.id, name: v.name }))
      );

      setValue("categoryId", product.categoryId);
      setValue("vendorId", product.vendorId || "");
    }
  }, [product, categoryHierarchy, vendors, setValue]);

  // Update Product Mutation
  const updateProductMutation = useUpdateProduct(productId);

  // Check if attribute already exists (case-insensitive)
  const attributeExists = (name: string) => {
    return attributes.some(
      (attr) => attr.name.toLowerCase() === name.toLowerCase()
    );
  };

  // Add new attribute
  const addAttribute = () => {
    if (!newAttributeName.trim()) return;

    const trimmedName = newAttributeName.trim();

    // Check for duplicate
    if (attributeExists(trimmedName)) {
      return;
    }

    const newAttr: Attribute = {
      id: Math.random().toString(36).substring(2, 11),
      name: trimmedName,
      values: [],
    };

    setAttributes([...attributes, newAttr]);
    setNewAttributeName("");
  };

  // Add global attribute to selected attributes
  const addGlobalAttribute = (globalAttr: GlobalAttribute) => {
    // Check if already added
    if (attributeExists(globalAttr.name)) {
      return;
    }

    const newAttr: Attribute = {
      id: Math.random().toString(36).substring(2, 11),
      name: globalAttr.name,
      values: globalAttr.values.map((v) => ({
        id: v.id,
        value: v.value,
      })),
    };

    setAttributes([...attributes, newAttr]);
  };

  // Remove attribute
  const removeAttribute = (attrId: string) => {
    setAttributes(attributes.filter((attr) => attr.id !== attrId));
  };

  // Add value to attribute
  const addValueToAttribute = (attrId: string, value: string) => {
    if (!value.trim()) return;

    setAttributes(
      attributes.map((attr) =>
        attr.id === attrId
          ? {
              ...attr,
              values: [
                ...attr.values,
                {
                  id: Math.random().toString(36).substring(2, 11),
                  value: value.trim(),
                },
              ],
            }
          : attr
      )
    );
  };

  // Remove value from attribute
  const removeValueFromAttribute = (attrId: string, valueId: string) => {
    setAttributes(
      attributes.map((attr) =>
        attr.id === attrId
          ? {
              ...attr,
              values: attr.values.filter((v) => v.id !== valueId),
            }
          : attr
      )
    );
  };

  // Generate all variant combinations
  const generateVariants = () => {
    if (attributes.length === 0) {
      setVariants([]);
      return;
    }

    // Generate cartesian product of all attribute values
    const generateCombinations = (
      attrs: Attribute[]
    ): Record<string, string>[] => {
      if (attrs.length === 0) return [{}];
      if (attrs.length === 1) {
        return attrs[0].values.map((v) => ({ [attrs[0].name]: v.value }));
      }

      const [first, ...rest] = attrs;
      const restCombinations = generateCombinations(rest);

      const combinations: Record<string, string>[] = [];
      for (const value of first.values) {
        for (const restCombo of restCombinations) {
          combinations.push({
            [first.name]: value.value,
            ...restCombo,
          });
        }
      }

      return combinations;
    };

    const combinations = generateCombinations(attributes);
    const newVariants: VariantInput[] = combinations.map((combo) => ({
      attributes: combo,
      price: parseFloat(basePrice) || 0,
      stock: 0,
      sku: undefined,
    }));

    setVariants(newVariants);
  };

  // Update variant
  const updateVariant = (
    index: number,
    field: keyof VariantInput,
    value: any
  ) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  // Remove variant
  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Handle form submission with React Hook Form
  const onSubmit = handleSubmit(async (formData) => {
    // Validate required fields
    if (!formData.productName.trim()) {
      alert("Product name is required");
      return;
    }

    if (!formData.categoryId) {
      alert("Category is required");
      return;
    }

    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      alert("Base price must be greater than 0");
      return;
    }

    const productData: CreateCompositeProductDto = {
      productInfo: {
        name: formData.productName,
        description: formData.description || undefined,
        categoryId: formData.categoryId,
        vendorId: formData.vendorId || undefined,
        price: parseFloat(formData.basePrice),
        isActive: formData.isActive,
      },
      attributes: attributes.map((attr) => ({
        name: attr.name,
        values: attr.values.map((v) => v.value),
      })),
      variants: variants.map((v) => ({
        ...v,
        price: parseFloat(String(v.price)),
        stock: parseInt(String(v.stock)),
      })),
    };

    updateProductMutation.mutate(
      { id: productId, data: productData },
      {
        onSuccess: () => {
          navigate({ to: `/dashboard/inventory/products/${productId}` });
        },
      }
    );
  });

  // Loading state - wait for product, categories, and vendors to all load
  const isAllDataLoaded =
    product && categoryHierarchy.length > 0 && vendors.length > 0;

  if (isLoading || !isAllDataLoaded) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              {isLoading
                ? "Loading product..."
                : "Loading categories and vendors..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            Error Loading Product
          </h2>
          <p className="text-sm text-red-800">
            {error instanceof Error ? error.message : "Failed to load product"}
          </p>
          <Button
            onClick={() => navigate({ to: "/dashboard/inventory/products" })}
            variant="outline"
            className="mt-4"
          >
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Edit Product: {productName}
        </h1>
        <p className="text-muted-foreground mt-2">
          Update product details, attributes, and variants
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Basic details about your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Premium Cotton T-Shirt"
                  {...register("productName", { required: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePrice">
                  Base Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...register("basePrice", { required: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your product..."
                {...register("description")}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <CustomSelect
                  id="category"
                  value={categoryId}
                  onChange={(value) => setValue("categoryId", value)}
                  placeholder="Select a category"
                  options={categoryHierarchy.map((category) => ({
                    value: category.id,
                    label: category.displayName,
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <CustomSelect
                  id="vendor"
                  value={vendorId || "none"}
                  onChange={(val) =>
                    setValue("vendorId", val === "none" ? "" : val)
                  }
                  placeholder="Select a vendor (optional)"
                  options={[
                    { value: "none", label: "No vendor" },
                    ...vendors.map((vendor) => ({
                      value: vendor.id,
                      label: vendor.name,
                    })),
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Product is active
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Product Attributes */}
        <Card>
          <CardHeader>
            <CardTitle>Product Attributes</CardTitle>
            <CardDescription>
              Use global attributes or define custom ones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Available Global Attributes */}
            {availableGlobalAttributes.length > 0 && (
              <div className="space-y-3 border rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold text-sm text-blue-900">
                  Available Global Attributes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {availableGlobalAttributes
                    .filter((ga) => !attributeExists(ga.name))
                    .map((globalAttr) => (
                      <Button
                        key={globalAttr.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addGlobalAttribute(globalAttr)}
                        className="bg-white hover:bg-blue-100"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {globalAttr.name}
                      </Button>
                    ))}
                </div>
                {availableGlobalAttributes.every((ga) =>
                  attributeExists(ga.name)
                ) && (
                  <p className="text-xs text-blue-700">
                    All global attributes already added
                  </p>
                )}
              </div>
            )}

            {/* Add Custom Attribute */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Create Custom Attribute
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Attribute name (e.g., Material, Brand)"
                  value={newAttributeName}
                  onChange={(e) => setNewAttributeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAttribute();
                    }
                  }}
                />
                <Button type="button" onClick={addAttribute} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom
                </Button>
              </div>
            </div>

            {/* Attributes List */}
            {attributes.length > 0 && (
              <div className="space-y-4">
                {attributes.map((attr) => {
                  const isGlobal = availableGlobalAttributes.some(
                    (ga) => ga.name.toLowerCase() === attr.name.toLowerCase()
                  );

                  return (
                    <Card key={attr.id} className="border-2">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-lg">
                                {attr.name}
                              </h4>
                              {isGlobal && (
                                <Badge variant="secondary" className="text-xs">
                                  Global
                                </Badge>
                              )}
                              {!isGlobal && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-orange-50"
                                >
                                  Custom
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {attr.values.length} value(s)
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttribute(attr.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        {/* Attribute Values */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {attr.values.map((val) => (
                            <Badge
                              key={val.id}
                              variant="secondary"
                              className="pl-3 pr-1"
                            >
                              {val.value}
                              <button
                                type="button"
                                onClick={() =>
                                  removeValueFromAttribute(attr.id, val.id)
                                }
                                className="ml-2 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>

                        {/* Add Value Input */}
                        <div className="flex gap-2">
                          <Input
                            placeholder={`Add ${attr.name.toLowerCase()} value`}
                            value={
                              attr.id === attributes[attributes.length - 1]?.id
                                ? newAttributeValue
                                : ""
                            }
                            onChange={(e) =>
                              setNewAttributeValue(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addValueToAttribute(attr.id, newAttributeValue);
                                setNewAttributeValue("");
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              addValueToAttribute(attr.id, newAttributeValue);
                              setNewAttributeValue("");
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Generate Variants Button */}
            {attributes.length > 0 &&
              attributes.every((a) => a.values.length > 0) && (
                <div className="rounded-md bg-amber-50 border border-amber-200 p-4 mb-4">
                  <p className="text-sm text-amber-800 mb-3">
                    Modifying attributes will regenerate all variant
                    combinations. Existing variant prices and stock will be
                    reset.
                  </p>
                  <Button
                    type="button"
                    onClick={generateVariants}
                    variant="default"
                    className="w-full"
                  >
                    Regenerate Variants (
                    {attributes.reduce(
                      (acc, attr) => acc * attr.values.length,
                      1
                    )}{" "}
                    combinations)
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Product Variants */}
        {variants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Variants</CardTitle>
              <CardDescription>
                Set pricing and stock for each variant combination. Variant
                attributes are read-only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {variants.map((variant, index) => (
                <Card key={index} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Variant Attributes Display (Read-only) */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            Variant Attributes
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(variant.attributes).map(
                              ([key, value]) => (
                                <Badge key={key} variant="outline">
                                  {key}: {value}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>

                        {/* Variant Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor={`sku-${index}`} className="text-sm">
                              SKU (Optional)
                            </Label>
                            <Input
                              id={`sku-${index}`}
                              placeholder="SKU-001"
                              value={variant.sku || ""}
                              onChange={(e) =>
                                updateVariant(index, "sku", e.target.value)
                              }
                            />
                          </div>

                          <div className="space-y-1">
                            <Label
                              htmlFor={`price-${index}`}
                              className="text-sm"
                            >
                              Price <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`price-${index}`}
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="0.00"
                              value={variant.price}
                              onChange={(e) =>
                                updateVariant(
                                  index,
                                  "price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <Label
                              htmlFor={`stock-${index}`}
                              className="text-sm"
                            >
                              Stock <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`stock-${index}`}
                              type="number"
                              min="0"
                              placeholder="0"
                              value={variant.stock}
                              onChange={(e) =>
                                updateVariant(
                                  index,
                                  "stock",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate({ to: `/dashboard/inventory/products/${productId}` })
            }
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateProductMutation.isPending}>
            {updateProductMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {updateProductMutation.isError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">
              Error updating product. Please check all fields and try again.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
