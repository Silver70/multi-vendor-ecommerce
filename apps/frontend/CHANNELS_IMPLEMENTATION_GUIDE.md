# Channels Feature Implementation Guide

This guide shows how to implement the Channels feature following the established frontend architecture patterns.

---

## Quick Start Checklist

- [ ] Create query file: `src/lib/queries/channels.ts`
- [ ] Add types: `src/types/channel.ts` 
- [ ] Create route page: `src/routes/dashboard/channels/index.tsx`
- [ ] Create modals: `src/components/CreateChannelModal.tsx`, `UpdateChannelModal.tsx`
- [ ] Update sidebar navigation in `src/components/app-sidebar.tsx`
- [ ] Export from query index: `src/lib/queries/index.ts`

---

## Step 1: Create Query File

**File**: `src/lib/queries/channels.ts`

```typescript
import { createServerFn } from "@tanstack/react-start";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
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

export interface Channel {
  id: string;
  name: string;
  description?: string;
  code?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export interface CreateChannelDto {
  name: string;
  description?: string;
  code?: string;
  isActive?: boolean;
}

export interface UpdateChannelDto {
  name: string;
  description?: string;
  code?: string;
  isActive: boolean;
}

// ============================================================================
// Server Functions
// ============================================================================

export const getChannels = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<Channel>>(
      `${API_BASE_URL}/api/Channels`,
      {
        params: {
          pageSize: 100,
        },
      }
    );
    return response.data;
  }
);

export const getChannel = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<Channel>(
      `${API_BASE_URL}/api/Channels/${data}`
    );
    return response.data;
  });

export const createChannel = createServerFn({ method: "POST" })
  .inputValidator((d: CreateChannelDto) => d)
  .handler(async ({ data }) => {
    const response = await axios.post<Channel>(
      `${API_BASE_URL}/api/Channels`,
      data
    );
    return response.data;
  });

export const updateChannel = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; channel: UpdateChannelDto }) => d)
  .handler(async ({ data }) => {
    const response = await axios.put<Channel>(
      `${API_BASE_URL}/api/Channels/${data.id}`,
      data.channel
    );
    return response.data;
  });

export const deleteChannel = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    await axios.delete(`${API_BASE_URL}/api/Channels/${data}`);
    return { success: true };
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
      staleTime: 0,
    }),
};

// ============================================================================
// Mutation Hooks
// ============================================================================

export const useCreateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChannelDto) => {
      return await createChannel({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelQueries.lists() });
    },
  });
};

export const useUpdateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; channel: UpdateChannelDto }) => {
      return await updateChannel({ data });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: channelQueries.lists() });
      queryClient.invalidateQueries({
        queryKey: channelQueries.detail(variables.id),
      });
    },
  });
};

export const useDeleteChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteChannel({ data: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelQueries.lists() });
    },
  });
};

// ============================================================================
// Backward Compatibility Exports (for legacy imports)
// ============================================================================

export const getChannelsQueryOptions = channelQueries.getAll();
export const getChannelQueryOptions = (id: string) => channelQueries.getById(id);
```

---

## Step 2: Create Types File

**File**: `src/types/channel.ts`

```typescript
export type Channel = {
  id: string;
  name: string;
  description?: string;
  code?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
};
```

---

## Step 3: Create Route Page

**File**: `src/routes/dashboard/channels/index.tsx`

```typescript
"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Search,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { DataTable } from "~/components/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Channel, channelQueries, useDeleteChannel } from "~/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { CreateChannelModal } from "~/components/CreateChannelModal";
import { UpdateChannelModal } from "~/components/UpdateChannelModal";

export const Route = createFileRoute("/dashboard/channels")({
  component: RouteComponent,
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.prefetchQuery(channelQueries.getAll());
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    channelId: string;
    channelName: string;
  } | null>(null);

  const { data: channelsResponse, isLoading: isQueryLoading } = useQuery(
    channelQueries.getAll()
  );

  const deleteChannelMutation = useDeleteChannel();

  const channels = channelsResponse?.items || [];

  if (isQueryLoading) return <div>Loading...</div>;

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: ColumnDef<Channel>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="w-full justify-start"
          >
            Channel Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => <div>{row.getValue("code") || "N/A"}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div>{row.getValue("description") || "N/A"}</div>,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <div
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isActive
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const channel = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedChannel(channel);
                  setIsUpdateOpen(true);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDeleteConfirmation({
                    channelId: channel.id,
                    channelName: channel.name,
                  });
                }}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleDeleteConfirm = () => {
    if (!deleteConfirmation) return;

    deleteChannelMutation.mutate(deleteConfirmation.channelId, {
      onSuccess: () => {
        toast.success("Channel deleted successfully");
        setDeleteConfirmation(null);
      },
      onError: (err) => {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete channel";
        toast.error(errorMessage);
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Channels</h1>
          <p className="text-muted-foreground mt-2">
            Manage your sales channels
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Channel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Channels</CardTitle>
          <CardDescription>
            List of all channels in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <DataTable columns={columns} data={filteredChannels} />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Delete Channel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Are you sure you want to delete "{deleteConfirmation.channelName}"?
                This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmation(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deleteChannelMutation.isPending}
                >
                  {deleteChannelMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <CreateChannelModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {selectedChannel && (
        <UpdateChannelModal
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          channel={selectedChannel}
        />
      )}
    </div>
  );
}
```

---

## Step 4: Create Modal Components

**File**: `src/components/CreateChannelModal.tsx`

```typescript
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import {
  useCreateChannel,
  type CreateChannelDto,
  channelQueries,
} from "~/lib/queries";

interface CreateChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChannelFormData {
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
}

export function CreateChannelModal({
  open,
  onOpenChange,
}: CreateChannelModalProps) {
  const queryClient = useQueryClient();
  const createChannelMutation = useCreateChannel();
  const { register, handleSubmit, reset, formState } = useForm<ChannelFormData>(
    {
      defaultValues: {
        name: "",
        code: "",
        description: "",
        isActive: true,
      },
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    const channelData: CreateChannelDto = {
      name: data.name,
      code: data.code || undefined,
      description: data.description || undefined,
      isActive: data.isActive,
    };

    createChannelMutation.mutate(channelData, {
      onSuccess: () => {
        toast.success("Channel created successfully");
        queryClient.invalidateQueries({ queryKey: channelQueries.lists() });
        reset();
        onOpenChange(false);
        setIsSubmitting(false);
      },
      onError: (err) => {
        const message =
          err instanceof Error ? err.message : "Failed to create channel";
        toast.error(message);
        setIsSubmitting(false);
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Channel</DialogTitle>
          <DialogDescription>
            Add a new sales channel to your system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Direct Store"
              {...register("name", {
                required: "Channel name is required",
                maxLength: {
                  value: 200,
                  message: "Name cannot exceed 200 characters",
                },
              })}
            />
            {formState.errors.name && (
              <p className="text-sm text-red-600">
                {formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Channel Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Channel Code (Optional)</Label>
            <Input
              id="code"
              placeholder="e.g., DS-001"
              {...register("code", {
                maxLength: {
                  value: 50,
                  message: "Code cannot exceed 50 characters",
                },
              })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Channel description..."
              {...register("description", {
                maxLength: {
                  value: 1000,
                  message: "Description cannot exceed 1000 characters",
                },
              })}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              {...register("isActive")}
            />
            <Label htmlFor="isActive" className="font-normal cursor-pointer">
              Active
            </Label>
          </div>

          {/* Error Message */}
          {createChannelMutation.isError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-red-800 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                {createChannelMutation.error instanceof Error
                  ? createChannelMutation.error.message
                  : "Failed to create channel. Please try again."}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**File**: `src/components/UpdateChannelModal.tsx`

```typescript
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import {
  useUpdateChannel,
  type UpdateChannelDto,
  type Channel,
  channelQueries,
} from "~/lib/queries";

interface UpdateChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel;
}

interface ChannelFormData {
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
}

export function UpdateChannelModal({
  open,
  onOpenChange,
  channel,
}: UpdateChannelModalProps) {
  const queryClient = useQueryClient();
  const updateChannelMutation = useUpdateChannel();
  const { register, handleSubmit, reset, formState } = useForm<ChannelFormData>(
    {
      defaultValues: {
        name: channel.name,
        code: channel.code || "",
        description: channel.description || "",
        isActive: channel.isActive,
      },
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      reset({
        name: channel.name,
        code: channel.code || "",
        description: channel.description || "",
        isActive: channel.isActive,
      });
    }
  }, [open, channel, reset]);

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    const channelData: UpdateChannelDto = {
      name: data.name,
      code: data.code || undefined,
      description: data.description || undefined,
      isActive: data.isActive,
    };

    updateChannelMutation.mutate(
      { id: channel.id, channel: channelData },
      {
        onSuccess: () => {
          toast.success("Channel updated successfully");
          queryClient.invalidateQueries({ queryKey: channelQueries.lists() });
          onOpenChange(false);
          setIsSubmitting(false);
        },
        onError: (err) => {
          const message =
            err instanceof Error ? err.message : "Failed to update channel";
          toast.error(message);
          setIsSubmitting(false);
        },
      }
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Channel</DialogTitle>
          <DialogDescription>
            Modify channel details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Direct Store"
              {...register("name", {
                required: "Channel name is required",
                maxLength: {
                  value: 200,
                  message: "Name cannot exceed 200 characters",
                },
              })}
            />
            {formState.errors.name && (
              <p className="text-sm text-red-600">
                {formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Channel Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Channel Code (Optional)</Label>
            <Input
              id="code"
              placeholder="e.g., DS-001"
              {...register("code", {
                maxLength: {
                  value: 50,
                  message: "Code cannot exceed 50 characters",
                },
              })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Channel description..."
              {...register("description", {
                maxLength: {
                  value: 1000,
                  message: "Description cannot exceed 1000 characters",
                },
              })}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              {...register("isActive")}
            />
            <Label htmlFor="isActive" className="font-normal cursor-pointer">
              Active
            </Label>
          </div>

          {/* Error Message */}
          {updateChannelMutation.isError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-red-800 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                {updateChannelMutation.error instanceof Error
                  ? updateChannelMutation.error.message
                  : "Failed to update channel. Please try again."}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Step 5: Update Sidebar Navigation

**File**: `src/components/app-sidebar.tsx`

Add to the `navMain` array:

```typescript
{
  title: "Channels",
  url: "/dashboard/channels",
  icon: Zap,  // or another appropriate icon from lucide-react
},
```

Make sure to import the icon at the top of the file.

---

## Step 6: Update Query Exports

**File**: `src/lib/queries/index.ts`

Add to the exports section:

```typescript
// ============================================================================
// Channels
// ============================================================================

export {
  // Server Functions
  getChannels,
  getChannel,
  createChannel,
  updateChannel,
  deleteChannel,
  // Query Builders
  channelQueries,
  // Mutations
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
  // Legacy Exports
  getChannelsQueryOptions,
  getChannelQueryOptions,
  // Types
  type Channel,
  type CreateChannelDto,
  type UpdateChannelDto,
  type PagedResult,
} from "./channels";
```

---

## Implementation Checklist

1. **Create Query File**
   - [ ] `src/lib/queries/channels.ts` with server functions, query builders, and mutation hooks

2. **Create Types**
   - [ ] `src/types/channel.ts` (optional, can be in queries file)

3. **Create Routes**
   - [ ] `src/routes/dashboard/channels/index.tsx` (list view)
   - [ ] Optional: `src/routes/dashboard/channels/$channelId.tsx` (detail view)
   - [ ] Optional: `src/routes/dashboard/channels/$channelId/edit.tsx` (edit view)

4. **Create Components**
   - [ ] `src/components/CreateChannelModal.tsx`
   - [ ] `src/components/UpdateChannelModal.tsx`

5. **Update Navigation**
   - [ ] Add link in `src/components/app-sidebar.tsx`

6. **Update Exports**
   - [ ] Export from `src/lib/queries/index.ts`

7. **Test**
   - [ ] Can fetch channels
   - [ ] Can create channel
   - [ ] Can update channel
   - [ ] Can delete channel
   - [ ] Query cache is invalidated correctly
   - [ ] Toast notifications appear

---

## Query Key Hierarchy

```
Channels:
  - ["channels"]              // Root key
  - ["channels", "list"]      // All channels list
  - ["channels", "detail", id] // Single channel
```

---

## Common Patterns Used

### 1. List with Search and Filter
```typescript
const filteredChannels = channels.filter((channel) =>
  channel.name.toLowerCase().includes(searchQuery.toLowerCase())
);
<DataTable columns={columns} data={filteredChannels} />
```

### 2. Modal Dialog Pattern
```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  </DialogContent>
</Dialog>
```

### 3. React Query Integration
```typescript
const { data: channelsResponse } = useQuery(channelQueries.getAll());
const createMutation = useCreateChannel();

createMutation.mutate(data, {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: channelQueries.lists() });
  },
});
```

### 4. Form Handling with React Hook Form
```typescript
const { register, handleSubmit, formState } = useForm<FormData>();
const onSubmit = handleSubmit((data) => { /* ... */ });

return (
  <form onSubmit={onSubmit}>
    <Input {...register("name", { required: true })} />
    {formState.errors.name && <p>{formState.errors.name.message}</p>}
  </form>
);
```

---

## Testing the Implementation

1. Navigate to `/dashboard/channels`
2. Should see list of channels
3. Click "Create Channel" button
4. Fill in form and submit
5. New channel should appear in list
6. Click edit on a channel
7. Modify and save
8. Delete should show confirmation dialog
9. All operations should show toast notifications

---

## Troubleshooting

### Queries not updating
- Make sure to call `queryClient.invalidateQueries()` in mutation `onSuccess`
- Check that query key matches between `queryOptions` and `invalidateQueries`

### TypeScript errors
- Check that types are exported from query file
- Make sure all function signatures match the DTOs

### Routes not working
- Verify route path matches the file structure
- Make sure to export `Route` from file

### Components not rendering
- Check that modals are imported in page component
- Verify `open` and `onOpenChange` props are passed correctly

---

## Resources

- See `src/lib/queries/products.ts` for a complete example
- See `src/routes/dashboard/orders/index.tsx` for route pattern
- See `src/components/CreateVendorModal.tsx` for modal pattern

