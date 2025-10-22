import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
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

import { getCategoriesQueryOptions } from "~/lib/categoryFn";
import { getVendorsQueryOptions } from "~/lib/vendorFn";
import {
  createCompositeProduct,
  getGlobalAttributesQueryOptions,
  type CreateCompositeProductDto,
  type VariantInput,
  type GlobalAttribute,
} from "~/lib/productFn";

export const Route = createFileRoute("/dashboard/inventory/products/create")({
  component: RouteComponent,
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.prefetchQuery(getCategoriesQueryOptions);
    queryClient.prefetchQuery(getVendorsQueryOptions);
    queryClient.prefetchQuery(getGlobalAttributesQueryOptions);
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

function RouteComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categoriesResponse } = useQuery(getCategoriesQueryOptions);
  const { data: vendorsResponse } = useQuery(getVendorsQueryOptions);
  const { data: globalAttributes } = useQuery(getGlobalAttributesQueryOptions);

  const categories = categoriesResponse?.items || [];
  const vendors = vendorsResponse?.items || [];
  const availableGlobalAttributes = globalAttributes || [];

  // Product Info State
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Attributes State
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");

  // Variants State (auto-generated variants with pricing)
  const [variants, setVariants] = useState<VariantInput[]>([]);

  // Create Product Mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: CreateCompositeProductDto) => {
      return await createCompositeProduct({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate({ to: "/dashboard/inventory/products" });
    },
  });

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData: CreateCompositeProductDto = {
      productInfo: {
        name: productName,
        description: description || undefined,
        categoryId,
        vendorId: vendorId || undefined,
        price: parseFloat(basePrice),
        isActive,
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

    createProductMutation.mutate(productData);
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Create New Product
        </h1>
        <p className="text-muted-foreground mt-2">
          Add a new product with variants and attributes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
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
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your product..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={categoryId}
                  onValueChange={setCategoryId}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">
                  Vendor <span className="text-red-500">*</span>
                </Label>
                <Select value={vendorId} onValueChange={setVendorId} required>
                  <SelectTrigger id="vendor">
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
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
              <label className="text-sm font-medium">Create Custom Attribute</label>
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
                            onChange={(e) => setNewAttributeValue(e.target.value)}
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
                <Button
                  type="button"
                  onClick={generateVariants}
                  variant="default"
                  className="w-full"
                >
                  Generate Variants (
                  {attributes.reduce(
                    (acc, attr) => acc * attr.values.length,
                    1
                  )}{" "}
                  combinations)
                </Button>
              )}
          </CardContent>
        </Card>

        {/* Product Variants */}
        {variants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Variants</CardTitle>
              <CardDescription>
                Set pricing and stock for each variant combination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {variants.map((variant, index) => (
                <Card key={index} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Variant Attributes Display */}
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(variant.attributes).map(
                            ([key, value]) => (
                              <Badge key={key} variant="outline">
                                {key}: {value}
                              </Badge>
                            )
                          )}
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
            onClick={() => navigate({ to: "/dashboard/inventory/products" })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createProductMutation.isPending}>
            {createProductMutation.isPending ? "Creating..." : "Create Product"}
          </Button>
        </div>

        {createProductMutation.isError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">
              Error creating product. Please check all fields and try again.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
