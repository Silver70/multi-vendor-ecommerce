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

export interface AddressInfo {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

export interface PaymentInfo {
  id: string;
  orderId: string;
  method: string;
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
  customerId: string;
  addressId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customer?: CustomerDto;
  address?: AddressInfo;
  items?: OrderItemInfo[];
  payments?: PaymentInfo[];
}

export interface CreateOrderItemDto {
  variantId: string;
  quantity: number;
}

export interface CreateOrderDto {
  customerId: string;
  addressId: string;
  items: CreateOrderItemDto[];
}

export interface UpdateOrderDto {
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
}

// ============================================================================
// Server Functions
// ============================================================================

// Get all orders with pagination
export const getOrders = createServerFn({ method: "GET" }).handler(async () => {
  const response = await axios.get<PagedResult<Order>>(
    `${API_BASE_URL}/api/Orders`
  );
  return response.data;
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

// ============================================================================
// Query Options (for use with useQuery)
// ============================================================================

export const orderQueries = {
  all: () => ["orders"] as const,
  lists: () => [...orderQueries.all(), "list"] as const,
  detail: (id: string) => [...orderQueries.all(), "detail", id] as const,

  getAll: () =>
    queryOptions({
      queryKey: orderQueries.lists(),
      queryFn: () => getOrders(),
    }),

  getById: (id: string) =>
    queryOptions({
      queryKey: orderQueries.detail(id),
      queryFn: () => getOrder({ data: id }),
      enabled: !!id,
    }),
};

// ============================================================================
// Mutation Hooks
// ============================================================================

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderDto) => {
      return await createOrder({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderQueries.lists() });
    },
  });
};

export const useUpdateOrder = (orderId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; order: UpdateOrderDto }) => {
      return await updateOrder({ data: payload });
    },
    onSuccess: () => {
      if (orderId) {
        queryClient.invalidateQueries({
          queryKey: orderQueries.detail(orderId),
        });
      }
      queryClient.invalidateQueries({ queryKey: orderQueries.lists() });
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      return await deleteOrder({ data: orderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderQueries.lists() });
    },
  });
};

// ============================================================================
// Backward Compatibility Exports (for legacy imports)
// ============================================================================

export const getOrdersQueryOptions = orderQueries.getAll();
export const getOrderQueryOptions = (id: string) => orderQueries.getById(id);
