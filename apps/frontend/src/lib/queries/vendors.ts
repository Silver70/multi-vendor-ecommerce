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

export interface Vendor {
  id: string;
  name: string;
  contactEmail?: string;
  website?: string;
}

// ============================================================================
// Server Functions
// ============================================================================

// Get all vendors with pagination
export const getVendors = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<Vendor>>(
      `${API_BASE_URL}/api/Vendors`,
      {
        params: {
          pageSize: 100, // Request max page size to get all vendors
        },
      }
    );
    return response.data;
  }
);

// ============================================================================
// Query Options (for use with useQuery)
// ============================================================================

export const vendorQueries = {
  all: () => ["vendors"] as const,
  lists: () => [...vendorQueries.all(), "list"] as const,

  getAll: () =>
    queryOptions({
      queryKey: vendorQueries.lists(),
      queryFn: () => getVendors(),
    }),
};

// ============================================================================
// Backward Compatibility Exports (for legacy imports)
// ============================================================================

export const getVendorsQueryOptions = vendorQueries.getAll();
