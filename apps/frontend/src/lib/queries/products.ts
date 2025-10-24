import { createServerFn } from "@tanstack/react-start";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product, ProductDetails } from "~/types/product";
import axios from "axios";

const API_BASE_URL = "http://localhost:5176";

// ============================================================================
// DTOs & Interfaces
// ============================================================================

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

export interface ProductAttributeInput {
  name: string;
  values: string[];
}

export interface VariantInput {
  sku?: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface ProductInfoDto {
  name: string;
  description?: string;
  categoryId: string;
  vendorId?: string;
  price: number;
  isActive?: boolean;
}

export interface CreateCompositeProductDto {
  productInfo: ProductInfoDto;
  attributes: ProductAttributeInput[];
  variants: VariantInput[];
}

export interface ProductAttributeOutput {
  name: string;
  values: string[];
}

export interface VariantOutput {
  id: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  createdAt: string;
}

export interface CompositeProductResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  vendorId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  attributes: ProductAttributeOutput[];
  variants: VariantOutput[];
}

export interface GlobalAttributeValue {
  id: string;
  value: string;
}

export interface GlobalAttribute {
  id: string;
  name: string;
  values: GlobalAttributeValue[];
}

// ============================================================================
// Server Functions
// ============================================================================

// Get all products with pagination
export const getProducts = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<Product>>(
      `${API_BASE_URL}/api/Products`
    );
    return response.data;
  }
);

// Get a single product by ID
export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<ProductDetails>(
      `${API_BASE_URL}/api/Products/${data}`
    );
    return response.data;
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

// Create a new product
export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((d: CreateProductDto) => d)
  .handler(async ({ data }) => {
    const response = await axios.post<Product>(
      `${API_BASE_URL}/api/Products/composite`,
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

// Create a composite product (with attributes and variants)
export const createCompositeProduct = createServerFn({ method: "POST" })
  .inputValidator((d: CreateCompositeProductDto) => d)
  .handler(async ({ data }) => {
    const response = await axios.post<CompositeProductResponse>(
      `${API_BASE_URL}/api/Products/composite`,
      data
    );
    return response.data;
  });

// Update a composite product (with attributes and variants)
export const updateCompositeProduct = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { id: string; data: CreateCompositeProductDto }) => d
  )
  .handler(async ({ data: payload }) => {
    const response = await axios.put<CompositeProductResponse>(
      `${API_BASE_URL}/api/Products/${payload.id}/composite`,
      payload.data
    );
    return response.data;
  });

// Get all global attributes
export const getGlobalAttributes = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<GlobalAttribute[]>(
      `${API_BASE_URL}/api/Attributes`
    );
    return response.data;
  }
);

// ============================================================================
// Query Options (for use with useQuery)
// ============================================================================

export const productQueries = {
  all: () => ["products"] as const,
  lists: () => [...productQueries.all(), "list"] as const,
  detail: (id: string) => [...productQueries.all(), "detail", id] as const,
  bySlug: (slug: string) => [...productQueries.all(), "slug", slug] as const,

  getAll: () =>
    queryOptions({
      queryKey: productQueries.lists(),
      queryFn: () => getProducts(),
    }),

  getById: (id: string) =>
    queryOptions({
      queryKey: productQueries.detail(id),
      queryFn: () => getProduct({ data: id }),
      enabled: !!id,
    }),

  getBySlug: (slug: string) =>
    queryOptions({
      queryKey: productQueries.bySlug(slug),
      queryFn: () => getProductBySlug({ data: slug }),
      enabled: !!slug,
    }),
};

export const attributeQueries = {
  all: () => ["globalAttributes"] as const,

  getAll: () =>
    queryOptions({
      queryKey: attributeQueries.all(),
      queryFn: () => getGlobalAttributes(),
    }),
};

// ============================================================================
// Mutation Hooks
// ============================================================================

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCompositeProductDto) => {
      return await createCompositeProduct({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueries.lists() });
    },
  });
};

export const useUpdateProduct = (productId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; data: CreateCompositeProductDto }) => {
      return await updateCompositeProduct({ data: payload });
    },
    onSuccess: () => {
      if (productId) {
        queryClient.invalidateQueries({
          queryKey: productQueries.detail(productId),
        });
      }
      queryClient.invalidateQueries({ queryKey: productQueries.lists() });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      return await deleteProduct({ data: productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueries.lists() });
    },
  });
};

// ============================================================================
// Backward Compatibility Exports (for legacy imports)
// ============================================================================

// Query options exports (original names)
export const getProductsQueryOptions = productQueries.getAll();
export const getProductQueryOptions = (id: string) => productQueries.getById(id);
export const getProductBySlugQueryOptions = (slug: string) => productQueries.getBySlug(slug);
export const getGlobalAttributesQueryOptions = attributeQueries.getAll();
