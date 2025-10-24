import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
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
}

// ============================================================================
// Server Functions
// ============================================================================

// Get all categories with pagination
export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<Category>>(
      `${API_BASE_URL}/api/Categories`
    );
    return response.data;
  }
);

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
// Backward Compatibility Exports (for legacy imports)
// ============================================================================

export const getCategoriesQueryOptions = categoryQueries.getAll();
