import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { ProductVariant } from "~/types/productVariant";

import axios from "axios";

const API_BASE_URL = "http://localhost:5176";

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateProductVariantDto {
  productId: string;
  sku: string;
  price: number;
  stock?: number;
  attributes?: string;
}

export interface UpdateProductVariantDto {
  sku: string;
  price: number;
  stock: number;
  attributes?: string;
}

export interface ProductVariantFilterParams {
  productId?: string;
  sku?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

// Get all product variants with pagination and filtering
export const getProductVariants = createServerFn({ method: "GET" })
  .inputValidator((d?: ProductVariantFilterParams) => d)
  .handler(async ({ data }) => {
    const params = new URLSearchParams();

    if (data?.productId) params.append("ProductId", data.productId);
    if (data?.sku) params.append("Sku", data.sku);
    if (data?.minPrice !== undefined) params.append("MinPrice", data.minPrice.toString());
    if (data?.maxPrice !== undefined) params.append("MaxPrice", data.maxPrice.toString());
    if (data?.inStock !== undefined) params.append("InStock", data.inStock.toString());
    if (data?.pageNumber) params.append("PageNumber", data.pageNumber.toString());
    if (data?.pageSize) params.append("PageSize", data.pageSize.toString());
    if (data?.sortBy) params.append("SortBy", data.sortBy);
    if (data?.sortDescending !== undefined) params.append("SortDescending", data.sortDescending.toString());

    const queryString = params.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/ProductVariants?${queryString}`
      : `${API_BASE_URL}/api/ProductVariants`;

    const response = await axios.get<PagedResult<ProductVariant>>(url);
    return response.data;
  });

export const getProductVariantsQueryOptions = (filters?: ProductVariantFilterParams) =>
  queryOptions({
    queryKey: ["productVariants", filters],
    queryFn: () => getProductVariants({ data: filters }),
  });

// Get a single product variant by ID
export const getProductVariant = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<ProductVariant>(
      `${API_BASE_URL}/api/ProductVariants/${data}`
    );
    return response.data;
  });

export const getProductVariantQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["productVariants", id],
    queryFn: () => getProductVariant({ data: id }),
    enabled: !!id,
  });

// Create a new product variant
export const createProductVariant = createServerFn({ method: "POST" })
  .inputValidator((d: CreateProductVariantDto) => d)
  .handler(async ({ data }) => {
    const response = await axios.post<ProductVariant>(
      `${API_BASE_URL}/api/ProductVariants`,
      data
    );
    return response.data;
  });

// Update an existing product variant
export const updateProductVariant = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; variant: UpdateProductVariantDto }) => d)
  .handler(async ({ data }) => {
    const response = await axios.put<ProductVariant>(
      `${API_BASE_URL}/api/ProductVariants/${data.id}`,
      data.variant
    );
    return response.data;
  });

// Delete a product variant
export const deleteProductVariant = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    await axios.delete(`${API_BASE_URL}/api/ProductVariants/${data}`);
    return { success: true };
  });
