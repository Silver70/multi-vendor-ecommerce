import { createServerFn } from "@tanstack/react-start";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
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

export interface Category {
  id: string;
  parentId?: string;
  name: string;
  slug: string;
  parentName?: string;
  productCount: number;
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  parentId?: string;
}

// ============================================================================
// Server Functions
// ============================================================================

// Get all categories with pagination
export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<Category>>(
      `${API_BASE_URL}/api/Categories`,
      {
        params: {
          pageSize: 100, // Request max page size to get all categories
        },
      }
    );
    return response.data;
  }
);

// Create a new category
export const createCategory = createServerFn({ method: "POST" })
  .inputValidator((d: CreateCategoryDto) => d)
  .handler(async ({ data }) => {
    const response = await axios.post<Category>(
      `${API_BASE_URL}/api/Categories`,
      data
    );
    return response.data;
  });

// ============================================================================
// Query Options (for use with useQuery)
// ============================================================================

export const categoryQueries = {
  all: () => ["categories"] as const,
  lists: () => [...categoryQueries.all(), "list"] as const,

  getAll: () =>
    queryOptions({
      queryKey: categoryQueries.lists(),
      queryFn: () => getCategories(),
    }),
};

// ============================================================================
// Mutation Hooks
// ============================================================================

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryDto) => {
      return await createCategory({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueries.lists() });
    },
  });
};

// ============================================================================
// Backward Compatibility Exports (for legacy imports)
// ============================================================================

export const getCategoriesQueryOptions = categoryQueries.getAll();
