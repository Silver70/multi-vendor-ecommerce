import { createServerFn } from "@tanstack/react-start";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Channel,
  ChannelTaxRule,
  ChannelProduct,
  ChannelVendor,
  TaxCalculation,
  CreateChannelDto,
  UpdateChannelDto,
  CreateChannelTaxRuleDto,
  UpdateChannelTaxRuleDto,
  CreateChannelProductDto,
  UpdateChannelProductDto,
  CreateChannelVendorDto,
} from "~/types/channel";
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

// ============================================================================
// Server Functions - Channels
// ============================================================================

// Get all channels
export const getChannels = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<Channel[]>(
      `${API_BASE_URL}/api/channels`
    );
    return response.data;
  }
);

// Get a single channel by ID
export const getChannel = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<Channel>(
      `${API_BASE_URL}/api/channels/${data}`
    );
    return response.data;
  });

// Create a new channel
export const createChannel = createServerFn({ method: "POST" })
  .inputValidator((d: CreateChannelDto) => d)
  .handler(async ({ data }) => {
    const response = await axios.post<Channel>(
      `${API_BASE_URL}/api/channels`,
      data
    );
    return response.data;
  });

// Update an existing channel
export const updateChannel = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; data: UpdateChannelDto }) => d)
  .handler(async ({ data }) => {
    const response = await axios.put<Channel>(
      `${API_BASE_URL}/api/channels/${data.id}`,
      data.data
    );
    return response.data;
  });

// Delete a channel
export const deleteChannel = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    await axios.delete(`${API_BASE_URL}/api/channels/${data}`);
    return { success: true };
  });

// ============================================================================
// Server Functions - Channel Tax Rules
// ============================================================================

// Get all tax rules for a channel
export const getChannelTaxRules = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<ChannelTaxRule[]>(
      `${API_BASE_URL}/api/channels/${data}/tax-rules`
    );
    return response.data;
  });

// Get a single tax rule by ID
export const getChannelTaxRule = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<ChannelTaxRule>(
      `${API_BASE_URL}/api/channels/tax-rules/${data}`
    );
    return response.data;
  });

// Create a tax rule for a channel
export const createChannelTaxRule = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { channelId: string; data: CreateChannelTaxRuleDto }) => d
  )
  .handler(async ({ data }) => {
    const response = await axios.post<ChannelTaxRule>(
      `${API_BASE_URL}/api/channels/${data.channelId}/tax-rules`,
      data.data
    );
    return response.data;
  });

// Update a tax rule
export const updateChannelTaxRule = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { ruleId: string; data: UpdateChannelTaxRuleDto }) => d
  )
  .handler(async ({ data }) => {
    const response = await axios.put<ChannelTaxRule>(
      `${API_BASE_URL}/api/channels/tax-rules/${data.ruleId}`,
      data.data
    );
    return response.data;
  });

// Delete a tax rule
export const deleteChannelTaxRule = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    await axios.delete(`${API_BASE_URL}/api/channels/tax-rules/${data}`);
    return { success: true };
  });

// Calculate tax for an order
export const calculateChannelTax = createServerFn({ method: "GET" })
  .inputValidator(
    (d: {
      channelId: string;
      amount: number;
      categoryId?: string;
      isB2B?: boolean;
    }) => d
  )
  .handler(async ({ data }) => {
    const params = new URLSearchParams({
      amount: data.amount.toString(),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.isB2B !== undefined && { isB2B: data.isB2B.toString() }),
    });

    const response = await axios.get<TaxCalculation>(
      `${API_BASE_URL}/api/channels/${data.channelId}/calculate-tax?${params}`
    );
    return response.data;
  });

// ============================================================================
// Server Functions - Channel Products
// ============================================================================

// Get products for a channel
export const getChannelProducts = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<ChannelProduct[]>(
      `${API_BASE_URL}/api/channels/${data}/products`
    );
    return response.data;
  });

// Add a product to a channel
export const addProductToChannel = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { channelId: string; data: CreateChannelProductDto }) => d
  )
  .handler(async ({ data }) => {
    const response = await axios.post<ChannelProduct>(
      `${API_BASE_URL}/api/channels/${data.channelId}/products`,
      data.data
    );
    return response.data;
  });

// Update channel product
export const updateChannelProduct = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { channelProductId: string; data: UpdateChannelProductDto }) => d
  )
  .handler(async ({ data }) => {
    const response = await axios.put<ChannelProduct>(
      `${API_BASE_URL}/api/channels/products/${data.channelProductId}`,
      data.data
    );
    return response.data;
  });

// Remove product from channel
export const removeProductFromChannel = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    await axios.delete(
      `${API_BASE_URL}/api/channels/products/${data}`
    );
    return { success: true };
  });

// ============================================================================
// Server Functions - Channel Vendors
// ============================================================================

// Get vendors for a channel
export const getChannelVendors = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<ChannelVendor[]>(
      `${API_BASE_URL}/api/channels/${data}/vendors`
    );
    return response.data;
  });

// Add a vendor to a channel
export const addVendorToChannel = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { channelId: string; data: CreateChannelVendorDto }) => d
  )
  .handler(async ({ data }) => {
    const response = await axios.post<ChannelVendor>(
      `${API_BASE_URL}/api/channels/${data.channelId}/vendors`,
      data.data
    );
    return response.data;
  });

// Remove vendor from channel
export const removeVendorFromChannel = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    await axios.delete(
      `${API_BASE_URL}/api/channels/vendors/${data}`
    );
    return { success: true };
  });

// Get channels for a vendor
export const getVendorChannels = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<ChannelVendor[]>(
      `${API_BASE_URL}/api/vendors/${data}/channels`
    );
    return response.data;
  });

// ============================================================================
// Query Options (for use with useQuery)
// ============================================================================

export const channelQueries = {
  all: () => ["channels"] as const,
  lists: () => [...channelQueries.all(), "list"] as const,
  detail: (id: string) => [...channelQueries.all(), "detail", id] as const,

  getAll: () =>
    queryOptions({
      queryKey: channelQueries.lists(),
      queryFn: () => getChannels(),
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }),

  getById: (id: string) =>
    queryOptions({
      queryKey: channelQueries.detail(id),
      queryFn: () => getChannel({ data: id }),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }),
};

export const channelTaxRuleQueries = {
  all: () => ["channelTaxRules"] as const,
  lists: (channelId: string) =>
    [...channelTaxRuleQueries.all(), "list", channelId] as const,
  detail: (ruleId: string) =>
    [...channelTaxRuleQueries.all(), "detail", ruleId] as const,

  getByChannelId: (channelId: string) =>
    queryOptions({
      queryKey: channelTaxRuleQueries.lists(channelId),
      queryFn: () => getChannelTaxRules({ data: channelId }),
      enabled: !!channelId,
      staleTime: 5 * 60 * 1000,
    }),

  getById: (ruleId: string) =>
    queryOptions({
      queryKey: channelTaxRuleQueries.detail(ruleId),
      queryFn: () => getChannelTaxRule({ data: ruleId }),
      enabled: !!ruleId,
    }),

  calculateTax: (
    channelId: string,
    amount: number,
    categoryId?: string,
    isB2B?: boolean
  ) =>
    queryOptions({
      queryKey: [
        "channelTax",
        channelId,
        amount,
        categoryId,
        isB2B,
      ] as const,
      queryFn: () =>
        calculateChannelTax({
          data: { channelId, amount, categoryId, isB2B },
        }),
      enabled: !!channelId && amount > 0,
      staleTime: 1 * 60 * 1000, // Cache for 1 minute
    }),
};

export const channelProductQueries = {
  all: () => ["channelProducts"] as const,
  lists: (channelId: string) =>
    [...channelProductQueries.all(), "list", channelId] as const,

  getByChannelId: (channelId: string) =>
    queryOptions({
      queryKey: channelProductQueries.lists(channelId),
      queryFn: () => getChannelProducts({ data: channelId }),
      enabled: !!channelId,
      staleTime: 5 * 60 * 1000,
    }),
};

export const channelVendorQueries = {
  all: () => ["channelVendors"] as const,
  lists: (channelId: string) =>
    [...channelVendorQueries.all(), "list", channelId] as const,
  vendorLists: (vendorId: string) =>
    [...channelVendorQueries.all(), "vendor", vendorId] as const,

  getByChannelId: (channelId: string) =>
    queryOptions({
      queryKey: channelVendorQueries.lists(channelId),
      queryFn: () => getChannelVendors({ data: channelId }),
      enabled: !!channelId,
      staleTime: 5 * 60 * 1000,
    }),

  getByVendorId: (vendorId: string) =>
    queryOptions({
      queryKey: channelVendorQueries.vendorLists(vendorId),
      queryFn: () => getVendorChannels({ data: vendorId }),
      enabled: !!vendorId,
      staleTime: 5 * 60 * 1000,
    }),
};

// ============================================================================
// Mutation Hooks - Channels
// ============================================================================

export const useCreateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChannelDto) => {
      return await createChannel({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: channelQueries.lists(),
      });
    },
  });
};

export const useUpdateChannel = (channelId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateChannelDto) => {
      if (!channelId) throw new Error("Channel ID is required");
      return await updateChannel({ data: { id: channelId, data } });
    },
    onSuccess: () => {
      if (channelId) {
        queryClient.invalidateQueries({
          queryKey: channelQueries.detail(channelId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: channelQueries.lists(),
      });
    },
  });
};

export const useDeleteChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      return await deleteChannel({ data: channelId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: channelQueries.lists(),
      });
    },
  });
};

// ============================================================================
// Mutation Hooks - Channel Tax Rules
// ============================================================================

export const useCreateChannelTaxRule = (channelId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChannelTaxRuleDto) => {
      if (!channelId) throw new Error("Channel ID is required");
      return await createChannelTaxRule({
        data: { channelId, data },
      });
    },
    onSuccess: () => {
      if (channelId) {
        queryClient.invalidateQueries({
          queryKey: channelTaxRuleQueries.lists(channelId),
        });
      }
    },
  });
};

export const useUpdateChannelTaxRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      ruleId: string;
      data: UpdateChannelTaxRuleDto;
    }) => {
      return await updateChannelTaxRule({
        data: { ruleId: payload.ruleId, data: payload.data },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: channelTaxRuleQueries.lists(data.channelId),
      });
    },
  });
};

export const useDeleteChannelTaxRule = (channelId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      return await deleteChannelTaxRule({ data: ruleId });
    },
    onSuccess: () => {
      if (channelId) {
        queryClient.invalidateQueries({
          queryKey: channelTaxRuleQueries.lists(channelId),
        });
      }
    },
  });
};

// ============================================================================
// Mutation Hooks - Channel Products
// ============================================================================

export const useAddProductToChannel = (channelId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChannelProductDto) => {
      if (!channelId) throw new Error("Channel ID is required");
      return await addProductToChannel({
        data: { channelId, data },
      });
    },
    onSuccess: () => {
      if (channelId) {
        queryClient.invalidateQueries({
          queryKey: channelProductQueries.lists(channelId),
        });
      }
    },
  });
};

export const useUpdateChannelProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      channelProductId: string;
      data: UpdateChannelProductDto;
    }) => {
      return await updateChannelProduct({
        data: { channelProductId: payload.channelProductId, data: payload.data },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: channelProductQueries.all(),
      });
    },
  });
};

export const useRemoveProductFromChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelProductId: string) => {
      return await removeProductFromChannel({ data: channelProductId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: channelProductQueries.all(),
      });
    },
  });
};

// ============================================================================
// Mutation Hooks - Channel Vendors
// ============================================================================

export const useAddVendorToChannel = (channelId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChannelVendorDto) => {
      if (!channelId) throw new Error("Channel ID is required");
      return await addVendorToChannel({
        data: { channelId, data },
      });
    },
    onSuccess: () => {
      if (channelId) {
        queryClient.invalidateQueries({
          queryKey: channelVendorQueries.lists(channelId),
        });
      }
    },
  });
};

export const useRemoveVendorFromChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelVendorId: string) => {
      return await removeVendorFromChannel({ data: channelVendorId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: channelVendorQueries.all(),
      });
    },
  });
};

// ============================================================================
// Backward Compatibility Exports (for legacy imports)
// ============================================================================

export const getChannelsQueryOptions = channelQueries.getAll();
export const getChannelQueryOptions = (id: string) =>
  channelQueries.getById(id);
export const getChannelTaxRulesQueryOptions = (channelId: string) =>
  channelTaxRuleQueries.getByChannelId(channelId);
export const getChannelProductsQueryOptions = (channelId: string) =>
  channelProductQueries.getByChannelId(channelId);
export const getChannelVendorsQueryOptions = (channelId: string) =>
  channelVendorQueries.getByChannelId(channelId);
