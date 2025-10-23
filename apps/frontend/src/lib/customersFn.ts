import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import axios from "axios";

const API_BASE_URL = "http://localhost:5176";

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

// Get customer by Email
export const getCustomerByEmail = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<CustomerDto>(
      `${API_BASE_URL}/api/Customers/by-email/${data}`
    );
    return response.data;
  });

export const getCustomerByEmailQueryOptions = (email: string) =>
  queryOptions({
    queryKey: ["customers", "by-email", email],
    queryFn: () => getCustomerByEmail({ data: email }),
    enabled: !!email,
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
