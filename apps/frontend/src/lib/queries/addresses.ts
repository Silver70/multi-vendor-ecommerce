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

export interface AddressDto {
  id: string;
  customerId: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  country: string;
  phone?: string;
  customerName?: string;
}

export interface CreateAddressDto {
  customerId: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

export interface UpdateAddressDto {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

// ============================================================================
// Server Functions
// ============================================================================

// Get all addresses with pagination
export const getAddresses = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<AddressDto>>(
      `${API_BASE_URL}/api/Addresses`
    );
    return response.data;
  }
);

// Get addresses for a specific customer
export const getCustomerAddresses = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<PagedResult<AddressDto>>(
      `${API_BASE_URL}/api/Customers/${data}/addresses`
    );
    return response.data;
  });

// Get a single address by ID
export const getAddress = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<AddressDto>(
      `${API_BASE_URL}/api/Addresses/${data}`
    );
    return response.data;
  });

// Create a new address
export const createAddress = createServerFn({ method: "POST" })
  .inputValidator((d: CreateAddressDto) => d)
  .handler(async ({ data }) => {
    const response = await axios.post<AddressDto>(
      `${API_BASE_URL}/api/Addresses`,
      data
    );
    return response.data;
  });

// Update an existing address
export const updateAddress = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; data: UpdateAddressDto }) => d)
  .handler(async ({ data }) => {
    const response = await axios.put<AddressDto>(
      `${API_BASE_URL}/api/Addresses/${data.id}`,
      data.data
    );
    return response.data;
  });

// Delete an address
export const deleteAddress = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    await axios.delete(`${API_BASE_URL}/api/Addresses/${data}`);
    return { success: true };
  });

// ============================================================================
// Query Options (for use with useQuery)
// ============================================================================

export const addressQueries = {
  all: () => ["addresses"] as const,
  lists: () => [...addressQueries.all(), "list"] as const,
  detail: (id: string) => [...addressQueries.all(), "detail", id] as const,
  forCustomer: (customerId: string) => [...addressQueries.all(), "customer", customerId] as const,

  getAll: () =>
    queryOptions({
      queryKey: addressQueries.lists(),
      queryFn: () => getAddresses(),
    }),

  getById: (id: string) =>
    queryOptions({
      queryKey: addressQueries.detail(id),
      queryFn: () => getAddress({ data: id }),
      enabled: !!id,
    }),

  getForCustomer: (customerId: string) =>
    queryOptions({
      queryKey: addressQueries.forCustomer(customerId),
      queryFn: () => getCustomerAddresses({ data: customerId }),
      enabled: !!customerId,
    }),
};

// ============================================================================
// Mutation Hooks
// ============================================================================

export const useCreateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAddressDto) => {
      return await createAddress({ data });
    },
    onSuccess: (newAddress) => {
      queryClient.invalidateQueries({
        queryKey: addressQueries.forCustomer(newAddress.customerId),
      });
      queryClient.invalidateQueries({ queryKey: addressQueries.lists() });
    },
  });
};

export const useUpdateAddress = (addressId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; data: UpdateAddressDto }) => {
      return await updateAddress({ data: payload });
    },
    onSuccess: () => {
      if (addressId) {
        queryClient.invalidateQueries({
          queryKey: addressQueries.detail(addressId),
        });
      }
      queryClient.invalidateQueries({ queryKey: addressQueries.lists() });
    },
  });
};

export const useDeleteAddress = (customerId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: string) => {
      return await deleteAddress({ data: addressId });
    },
    onSuccess: () => {
      if (customerId) {
        queryClient.invalidateQueries({
          queryKey: addressQueries.forCustomer(customerId),
        });
      }
      queryClient.invalidateQueries({ queryKey: addressQueries.lists() });
    },
  });
};

// ============================================================================
// Backward Compatibility Exports (for legacy imports)
// ============================================================================

export const getAddressesQueryOptions = addressQueries.getAll();
export const getAddressQueryOptions = (id: string) => addressQueries.getById(id);
export const getCustomerAddressesQueryOptions = (customerId: string) =>
  addressQueries.getForCustomer(customerId);
