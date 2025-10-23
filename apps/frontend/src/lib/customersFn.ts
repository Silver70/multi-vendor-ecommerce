import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import axios from "axios";

const API_BASE_URL = "http://localhost:5176";

export interface CustomerDto {
  id: string;
  userId: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  userEmail?: string;
  userName?: string;
}

export interface CreateCustomerDto {
  userId: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface UpdateCustomerDto {
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface CreateOrGetCustomerDto {
  userId: string;
}

// Get customer by ID
export const getCustomer = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<CustomerDto>(
      `${API_BASE_URL}/api/Customers/${data}`
    );
    return response.data;
  });

export const getCustomerQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["customers", id],
    queryFn: () => getCustomer({ data: id }),
    enabled: !!id,
  });

// Get customer by User ID
export const getCustomerByUserId = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<CustomerDto>(
      `${API_BASE_URL}/api/Customers/by-user/${data}`
    );
    return response.data;
  });

export const getCustomerByUserIdQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["customers", "by-user", userId],
    queryFn: () => getCustomerByUserId({ data: userId }),
    enabled: !!userId,
  });

// Create customer with full profile
export const createCustomer = createServerFn({ method: "POST" })
  .inputValidator((d: CreateCustomerDto) => d)
  .handler(async ({ data }) => {
    const response = await axios.post<CustomerDto>(
      `${API_BASE_URL}/api/Customers`,
      data
    );
    return response.data;
  });

// Create or get customer (on-demand creation)
export const createOrGetCustomer = createServerFn({ method: "POST" })
  .inputValidator((d: CreateOrGetCustomerDto) => d)
  .handler(async ({ data }) => {
    const response = await axios.post<CustomerDto>(
      `${API_BASE_URL}/api/Customers/create-or-get`,
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

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Get all customers with pagination
export const getCustomers = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<CustomerDto>>(
      `${API_BASE_URL}/api/Customers`
    );
    return response.data;
  }
);

export const getCustomersQueryOptions = queryOptions({
  queryKey: ["customers"],
  queryFn: () => getCustomers(),
});
