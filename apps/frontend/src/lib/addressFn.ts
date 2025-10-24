import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
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

// Get all addresses with pagination
export const getAddresses = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<AddressDto>>(
      `${API_BASE_URL}/api/Addresses`
    );
    return response.data;
  }
);

export const getAddressesQueryOptions = queryOptions({
  queryKey: ["addresses"],
  queryFn: () => getAddresses(),
});

// Get addresses for a specific customer
export const getCustomerAddresses = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<PagedResult<AddressDto>>(
      `${API_BASE_URL}/api/Customers/${data}/addresses`
    );
    return response.data;
  });

export const getCustomerAddressesQueryOptions = (customerId: string) =>
  queryOptions({
    queryKey: ["addresses", "customer", customerId],
    queryFn: () => getCustomerAddresses({ data: customerId }),
    enabled: !!customerId,
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

export const getAddressQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["addresses", id],
    queryFn: () => getAddress({ data: id }),
    enabled: !!id,
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
