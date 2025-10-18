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

export interface AddressInfo {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

export interface OrderItemInfo {
  id: string;
  variantId: string;
  variantSku?: string;
  productName?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  addressId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  userName?: string;
  address?: AddressInfo;
  items?: OrderItemInfo[];
}

export interface CreateOrderItemDto {
  variantId: string;
  quantity: number;
}

export interface CreateOrderDto {
  userId: string;
  addressId: string;
  items: CreateOrderItemDto[];
}

export interface UpdateOrderDto {
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
}

// Get all orders with pagination
export const getOrders = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<Order>>(
      `${API_BASE_URL}/api/Orders`
    );
    return response.data;
  }
);

export const getOrdersQueryOptions = queryOptions({
  queryKey: ["orders"],
  queryFn: () => getOrders(),
});

// Get a single order by ID
export const getOrder = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<Order>(
      `${API_BASE_URL}/api/Orders/${data}`
    );
    return response.data;
  });

export const getOrderQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["orders", id],
    queryFn: () => getOrder({ data: id }),
    enabled: !!id,
  });

// Create a new order
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: CreateOrderDto) => d)
  .handler(async ({ data }) => {
    const response = await axios.post<Order>(
      `${API_BASE_URL}/api/Orders`,
      data
    );
    return response.data;
  });

// Update an existing order (status change)
export const updateOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; order: UpdateOrderDto }) => d)
  .handler(async ({ data }) => {
    const response = await axios.put<Order>(
      `${API_BASE_URL}/api/Orders/${data.id}`,
      data.order
    );
    return response.data;
  });

// Delete an order (only pending orders can be deleted)
export const deleteOrder = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    await axios.delete(`${API_BASE_URL}/api/Orders/${data}`);
    return { success: true };
  });
