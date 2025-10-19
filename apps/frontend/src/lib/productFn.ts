import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { Product, ProductDetails } from "~/types/product";

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

export interface CreateProductDto {
  vendorId?: string;
  categoryId: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateProductDto {
  vendorId?: string;
  categoryId: string;
  name: string;
  description?: string;
  isActive: boolean;
}

// Get all products with pagination
export const getProducts = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<Product>>(
      `${API_BASE_URL}/api/Products`
    );
    return response.data;
  }
);

export const getProductsQueryOptions = queryOptions({
  queryKey: ["products"],
  queryFn: () => getProducts(),
});

// Get a single product by ID
export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<ProductDetails>(
      `${API_BASE_URL}/api/Products/${data}`
    );
    return response.data;
  });

export const getProductQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["products", id],
    queryFn: () => getProduct({ data: id }),
    enabled: !!id,
  });

// Get a single product by slug
export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<ProductDetails>(
      `${API_BASE_URL}/api/Products/slug/${data}`
    );
    return response.data;
  });

export const getProductBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["products", "slug", slug],
    queryFn: () => getProductBySlug({ data: slug }),
    enabled: !!slug,
  });

// Create a new product
export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((d: CreateProductDto) => d)
  .handler(async ({ data }) => {
    const response = await axios.post<Product>(
      `${API_BASE_URL}/api/Products`,
      data
    );
    return response.data;
  });

// Update an existing product
export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; product: UpdateProductDto }) => d)
  .handler(async ({ data }) => {
    const response = await axios.put<Product>(
      `${API_BASE_URL}/api/Products/${data.id}`,
      data.product
    );
    return response.data;
  });

// Delete a product
export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    await axios.delete(`${API_BASE_URL}/api/Products/${data}`);
    return { success: true };
  });
