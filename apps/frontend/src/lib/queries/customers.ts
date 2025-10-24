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

export interface CustomerDto {
  id: string;
  createdByUserId?: string | null;
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  isFromWebsite: boolean;
  createdAt: string;
  createdByUserName?: string;
}

export interface CreateCustomerDto {
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface UpdateCustomerDto {
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

// ============================================================================
// Server Functions
// ============================================================================

// Get all customers with pagination
export const getCustomers = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<CustomerDto>>(
      `${API_BASE_URL}/api/Customers`
    );
    return response.data;
  }
);

// Get customer by ID
export const getCustomer = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<CustomerDto>(
      `${API_BASE_URL}/api/Customers/${data}`
    );
    return response.data;
  });

// Get customer by Email
export const getCustomerByEmail = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<CustomerDto>(
      `${API_BASE_URL}/api/Customers/by-email/${data}`
    );
    return response.data;
  });

// Create customer (admin-created)
export const createCustomer = createServerFn({ method: "POST" })
  .inputValidator((d: CreateCustomerDto) => d)
  .handler(async ({ data }) => {
    const response = await axios.post<CustomerDto>(
      `${API_BASE_URL}/api/Customers`,
      data
    );
    return response.data;
  });

// Update customer profile
export const updateCustomer = createServerFn()
  .inputValidator((d: { id: string; data: UpdateCustomerDto }) => d)
  .handler(async ({ data }) => {
    const response = await axios.put<CustomerDto>(
      `${API_BASE_URL}/api/Customers/${data.id}`,
      data.data
    );
    return response.data;
  });

// Delete customer
export const deleteCustomer = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    await axios.delete(`${API_BASE_URL}/api/Customers/${data}`);
    return { success: true };
  });

// ============================================================================
// Query Options (for use with useQuery)
// ============================================================================

export const customerQueries = {
  all: () => ["customers"] as const,
  lists: () => [...customerQueries.all(), "list"] as const,
  detail: (id: string) => [...customerQueries.all(), "detail", id] as const,
  byEmail: (email: string) => [...customerQueries.all(), "by-email", email] as const,

  getAll: () =>
    queryOptions({
      queryKey: customerQueries.lists(),
      queryFn: () => getCustomers(),
    }),

  getById: (id: string) =>
    queryOptions({
      queryKey: customerQueries.detail(id),
      queryFn: () => getCustomer({ data: id }),
      enabled: !!id,
    }),

  getByEmail: (email: string) =>
    queryOptions({
      queryKey: customerQueries.byEmail(email),
      queryFn: () => getCustomerByEmail({ data: email }),
      enabled: !!email,
    }),
};

// ============================================================================
// Mutation Hooks
// ============================================================================

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerDto) => {
      return await createCustomer({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerQueries.lists() });
    },
  });
};

export const useUpdateCustomer = (customerId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; data: UpdateCustomerDto }) => {
      return await updateCustomer({ data: payload });
    },
    onSuccess: () => {
      if (customerId) {
        queryClient.invalidateQueries({
          queryKey: customerQueries.detail(customerId),
        });
      }
      queryClient.invalidateQueries({ queryKey: customerQueries.lists() });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      return await deleteCustomer({ data: customerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerQueries.lists() });
    },
  });
};

// ============================================================================
// Backward Compatibility Exports (for legacy imports)
// ============================================================================

export const getCustomersQueryOptions = customerQueries.getAll();
export const getCustomerQueryOptions = (id: string) => customerQueries.getById(id);
export const getCustomerByEmailQueryOptions = (email: string) => customerQueries.getByEmail(email);
