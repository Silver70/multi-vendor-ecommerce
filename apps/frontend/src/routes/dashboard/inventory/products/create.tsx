import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Plus, X, Trash2, ChevronDown, Upload, ImagePlus, Loader } from "lucide-react";
import { useS3Upload } from "~/hooks/useS3Upload";

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
import { AttributeBrowserModal } from "~/components/AttributeBrowserModal";

import {
  categoryQueries,
  vendorQueries,
  attributeQueries,
  useCreateProduct,
  type CreateCompositeProductDto,
  type VariantInput,
  type GlobalAttribute,
} from "~/lib/queries";
import {
  buildCategoryHierarchy,
  flattenCategoryHierarchy,
} from "~/lib/utils/category-hierarchy";
import {
  groupEditPageVariants,
  hasMultipleAttributes,
} from "~/lib/utils/variant-grouping";

export const Route = createFileRoute("/dashboard/inventory/products/create")({
  component: RouteComponent,
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.prefetchQuery(categoryQueries.getAll());
    queryClient.prefetchQuery(vendorQueries.getAll());
    queryClient.prefetchQuery(attributeQueries.getPopular());
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
  const navigate = useNavigate();

  const { data: categoriesResponse } = useQuery(categoryQueries.getAll());
  const { data: vendorsResponse } = useQuery(vendorQueries.getAll());
  const { data: popularAttributes, isLoading: isLoadingPopular } = useQuery(
    attributeQueries.getPopular()
  );
  const { data: allAttributes, isLoading: isLoadingAll } = useQuery(
    attributeQueries.getAll()
  );

  const categories = categoriesResponse?.items || [];
  const vendors = vendorsResponse?.items || [];
  const availablePopularAttributes = popularAttributes || [];
  const availableAllAttributes = allAttributes || [];

  // State for attribute browser modal
  const [isAttributeBrowserOpen, setIsAttributeBrowserOpen] =
    React.useState(false);

  // Build hierarchical category structure
  const categoryHierarchy = React.useMemo(() => {
    if (categories.length === 0) return [];
    const hierarchy = buildCategoryHierarchy(categories);
    return flattenCategoryHierarchy(hierarchy);
  }, [categories]);

  // React Hook Form - replaces 7 useState calls for product info
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
  const basePrice = watch("basePrice");
  const categoryId = watch("categoryId");
  const vendorId = watch("vendorId");

  // Attributes and Variants State (complex nested state, kept in React.useState)
  const [attributes, setAttributes] = React.useState<Attribute[]>([]);
  const [newAttributeName, setNewAttributeName] = React.useState("");
  const [editingAttributeId, setEditingAttributeId] = React.useState<
    string | null
  >(null);
  const [editingAttributeValue, setEditingAttributeValue] = React.useState("");
  const [variants, setVariants] = React.useState<VariantInput[]>([]);

  // Product Images State
  const [productImages, setProductImages] = React.useState<
    { id: string; preview: string; file?: File; s3Url?: string; isUploading?: boolean; uploadError?: string }[]
  >([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { uploadFileToS3 } = useS3Upload();

  // State to track which variant groups are expanded on the create page
  const [expandedVariantGroups, setExpandedVariantGroups] = React.useState<
    Set<string>
  >(new Set());

  const toggleVariantGroupExpansion = (groupValue: string) => {
    const newExpanded = new Set(expandedVariantGroups);
    if (newExpanded.has(groupValue)) {
      newExpanded.delete(groupValue);
    } else {
      newExpanded.add(groupValue);
    }
    setExpandedVariantGroups(newExpanded);
  };

  // Create Product Mutation
  const createProductMutation = useCreateProduct();

  // Handle image file selection and upload to S3
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        const imageId = Math.random().toString(36).substring(2, 11);

        // Create preview immediately
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = event.target?.result as string;
          setProductImages((prev) => [
            ...prev,
            {
              id: imageId,
              preview,
              file,
              isUploading: true,
            },
          ]);

          // Start upload in background (not awaited in event handler)
          uploadFileToS3(file)
            .then((uploadResult) => {
              if (uploadResult) {
                // Update the image with S3 URL
                setProductImages((prev) =>
                  prev.map((img) =>
                    img.id === imageId
                      ? {
                          ...img,
                          s3Url: uploadResult.s3Url,
                          isUploading: false,
                          uploadError: undefined,
                        }
                      : img
                  )
                );
              } else {
                // Keep the image but mark it as failed
                setProductImages((prev) =>
                  prev.map((img) =>
                    img.id === imageId
                      ? {
                          ...img,
                          isUploading: false,
                          uploadError: "Upload failed. Please try again.",
                        }
                      : img
                  )
                );
              }
            })
            .catch((error) => {
              console.error("Upload error:", error);
              // Keep the image but show error
              const errorMsg = error instanceof Error ? error.message : "Upload failed";
              setProductImages((prev) =>
                prev.map((img) =>
                  img.id === imageId
                    ? {
                        ...img,
                        isUploading: false,
                        uploadError: errorMsg,
                      }
                    : img
                )
              );
            });
        };
        reader.readAsDataURL(file);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove image
  const removeImage = (imageId: string) => {
    setProductImages((prev) => prev.filter((img) => img.id !== imageId));
  };

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
    // Check if there are any images still uploading
    const uploadingImages = productImages.filter((img) => img.isUploading);
    if (uploadingImages.length > 0) {
      alert("Please wait for all images to finish uploading before submitting.");
      return;
    }

    // Check if there are any failed uploads and warn user
    const failedImages = productImages.filter((img) => img.uploadError);
    if (failedImages.length > 0) {
      const confirmSubmit = window.confirm(
        `${failedImages.length} image(s) failed to upload. Continue without them?`
      );
      if (!confirmSubmit) {
        return;
      }
    }

    const uploadedImages = productImages
      .filter((img) => img.s3Url && !img.uploadError) // Only include successfully uploaded images
      .map((img, index) => ({
        imageUrl: img.s3Url!,
        isPrimary: index === 0, // First image is primary
      }));

    console.log("Product images state:", productImages);
    console.log("Images to submit:", uploadedImages);

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
      images: uploadedImages,
    };

    console.log("Final product data being sent:", productData);

    createProductMutation.mutate(productData, {
      onSuccess: () => {
        navigate({ to: "/dashboard/inventory/products" });
      },
    });
  });

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Create New Product
        </h1>
        <p className="text-muted-foreground mt-2">
          Add a new product with variants and attributes
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Info and Attributes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>
                  Basic details about your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your product..."
                    {...register("description")}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Upload product images (JPG, PNG, WebP)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Area */}
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WebP up to 10MB
                  </p>
                </div>

                {/* Image Preview Grid */}
                {productImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {productImages.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="relative overflow-hidden rounded-lg bg-muted aspect-square">
                          <img
                            src={image.preview}
                            alt={`Product image ${index + 1}`}
                            className={`w-full h-full object-cover ${
                              image.uploadError ? "opacity-50" : ""
                            }`}
                          />
                          {image.isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader className="h-6 w-6 text-foreground animate-spin" />
                            </div>
                          )}
                          {image.uploadError && !image.isUploading && (
                            <div className="absolute inset-0 bg-destructive/90 flex items-center justify-center p-2">
                              <div className="text-destructive-foreground text-xs text-center">
                                <p className="font-semibold mb-1">Upload Failed</p>
                                <p>{image.uploadError}</p>
                              </div>
                            </div>
                          )}
                          {image.s3Url && !image.isUploading && !image.uploadError && (
                            <div className="absolute top-1 left-1 bg-accent text-accent-foreground text-xs px-2 py-1 rounded">
                              Uploaded
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(image.id)}
                          disabled={image.isUploading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        {index === 0 && !image.uploadError && (
                          <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {productImages.length === 0 && (
                  <div className="text-center py-4">
                    <ImagePlus className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No images uploaded yet
                    </p>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Add More Images
                </Button>
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
                {/* Popular Global Attributes - Quick Add Section */}
                {availablePopularAttributes.length > 0 && (
                  <div className="space-y-3 border rounded-lg p-4 bg-secondary/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm text-secondary-foreground">
                        Popular Attributes
                      </h4>
                      <p className="text-xs text-secondary-foreground/70">Quick add</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availablePopularAttributes
                        .filter((ga) => !attributeExists(ga.name))
                        .map((globalAttr) => (
                          <Button
                            key={globalAttr.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addGlobalAttribute(globalAttr)}
                            className="bg-background hover:bg-secondary/20"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {globalAttr.name}
                          </Button>
                        ))}
                    </div>
                    {availablePopularAttributes.length > 0 &&
                      availablePopularAttributes.every((ga) =>
                        attributeExists(ga.name)
                      ) && (
                        <p className="text-xs text-blue-700">
                          All popular attributes added
                        </p>
                      )}
                    {availablePopularAttributes.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-600 hover:text-blue-700 h-auto p-0"
                        onClick={() => setIsAttributeBrowserOpen(true)}
                      >
                        View All Attributes →
                      </Button>
                    )}
                  </div>
                )}

                {/* If no popular attributes, show View All button directly */}
                {availablePopularAttributes.length === 0 && (
                  <div className="border rounded-lg p-4 bg-muted/30 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Browse from all available attributes
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAttributeBrowserOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Browse Attributes
                    </Button>
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
                      const isGlobal = availableAllAttributes.some(
                        (ga) =>
                          ga.name.toLowerCase() === attr.name.toLowerCase()
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
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
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
                                  editingAttributeId === attr.id
                                    ? editingAttributeValue
                                    : ""
                                }
                                onChange={(e) => {
                                  setEditingAttributeId(attr.id);
                                  setEditingAttributeValue(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addValueToAttribute(
                                      attr.id,
                                      editingAttributeValue
                                    );
                                    setEditingAttributeId(null);
                                    setEditingAttributeValue("");
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  addValueToAttribute(
                                    attr.id,
                                    editingAttributeValue
                                  );
                                  setEditingAttributeId(null);
                                  setEditingAttributeValue("");
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
          </div>

          {/* Right Column - Category, Vendor, and Status */}
          <div className="lg:col-span-1">
            {/* Product Settings */}
            <Card className="h-fit sticky top-6">
              <CardHeader>
                <CardTitle>Product Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label htmlFor="vendor">
                    Vendor <span className="text-red-500">*</span>
                  </Label>
                  <CustomSelect
                    id="vendor"
                    value={vendorId}
                    onChange={(value) => setValue("vendorId", value)}
                    placeholder="Select a vendor"
                    options={vendors.map((vendor) => ({
                      value: vendor.id,
                      label: vendor.name,
                    }))}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register("isActive")}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer mb-0">
                    Product is active
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Variants */}
        {variants.length > 0 &&
          (() => {
            // Check if we should show grouped variants
            const shouldGroupVariants =
              variants.length > 0 && hasMultipleAttributes(variants as any);
            const groupedData = shouldGroupVariants
              ? groupEditPageVariants(variants)
              : null;

            return (
              <Card>
                <CardHeader>
                  <CardTitle>Product Variants</CardTitle>
                  <CardDescription>
                    Set pricing and stock for each variant combination
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {groupedData ? (
                    // Grouped variants display
                    <div className="space-y-2">
                      {groupedData.groups.map((group) => (
                        <div
                          key={group.groupValue}
                          className="border rounded-lg"
                        >
                          {/* Group header */}
                          <button
                            type="button"
                            onClick={() =>
                              toggleVariantGroupExpansion(group.groupValue)
                            }
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <ChevronDown
                                className={`h-5 w-5 transition-transform ${
                                  expandedVariantGroups.has(group.groupValue)
                                    ? "transform rotate-0"
                                    : "transform -rotate-90"
                                }`}
                              />
                              <div className="text-left">
                                <div className="font-semibold">
                                  {group.groupAttribute}: {group.groupValue}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {group.variantsWithIndices.length} variant
                                  {group.variantsWithIndices.length !== 1
                                    ? "s"
                                    : ""}
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Group content - variants */}
                          {expandedVariantGroups.has(group.groupValue) && (
                            <div className="border-t bg-muted/20 p-3 space-y-3">
                              {group.variantsWithIndices.map(
                                ({ index, variant }) => (
                                  <Card key={index} className="border">
                                    <CardContent className="pt-4">
                                      <div className="flex items-start gap-4">
                                        <div className="flex-1 space-y-3">
                                          {/* Variant Attributes Display */}
                                          <div className="flex flex-wrap gap-2">
                                            {Object.entries(
                                              variant.attributes
                                            ).map(([key, value]) => (
                                              <Badge
                                                key={key}
                                                variant="outline"
                                              >
                                                {key}: {String(value)}
                                              </Badge>
                                            ))}
                                          </div>

                                          {/* Variant Fields */}
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                              <Label
                                                htmlFor={`sku-${index}`}
                                                className="text-sm"
                                              >
                                                SKU (Optional)
                                              </Label>
                                              <Input
                                                id={`sku-${index}`}
                                                placeholder="SKU-001"
                                                value={variant.sku || ""}
                                                onChange={(e) =>
                                                  updateVariant(
                                                    index,
                                                    "sku",
                                                    e.target.value
                                                  )
                                                }
                                              />
                                            </div>

                                            <div className="space-y-1">
                                              <Label
                                                htmlFor={`price-${index}`}
                                                className="text-sm"
                                              >
                                                Price{" "}
                                                <span className="text-red-500">
                                                  *
                                                </span>
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
                                                    parseFloat(
                                                      e.target.value
                                                    ) || 0
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
                                                Stock{" "}
                                                <span className="text-red-500">
                                                  *
                                                </span>
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
                                                    parseInt(e.target.value) ||
                                                      0
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
                                )
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Flat variants display (no grouping)
                    variants.map((variant, index) => (
                      <Card key={index} className="border">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-3">
                              {/* Variant Attributes Display */}
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(variant.attributes).map(
                                  ([key, value]) => (
                                    <Badge key={key} variant="outline">
                                      {key}: {String(value)}
                                    </Badge>
                                  )
                                )}
                              </div>

                              {/* Variant Fields */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label
                                    htmlFor={`sku-${index}`}
                                    className="text-sm"
                                  >
                                    SKU (Optional)
                                  </Label>
                                  <Input
                                    id={`sku-${index}`}
                                    placeholder="SKU-001"
                                    value={variant.sku || ""}
                                    onChange={(e) =>
                                      updateVariant(
                                        index,
                                        "sku",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label
                                    htmlFor={`price-${index}`}
                                    className="text-sm"
                                  >
                                    Price{" "}
                                    <span className="text-red-500">*</span>
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
                                    Stock{" "}
                                    <span className="text-red-500">*</span>
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
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })()}

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
          <div className="rounded-md bg-destructive/10 border border-destructive p-4">
            <p className="text-sm text-destructive">
              Error creating product. Please check all fields and try again.
            </p>
          </div>
        )}
      </form>

      {/* Attribute Browser Modal */}
      <AttributeBrowserModal
        open={isAttributeBrowserOpen}
        onOpenChange={setIsAttributeBrowserOpen}
        attributes={availableAllAttributes}
        selectedAttributeNames={attributes.map((attr) => attr.name)}
        onSelectAttribute={addGlobalAttribute}
        isLoading={isLoadingAll}
      />
    </div>
  );
}
