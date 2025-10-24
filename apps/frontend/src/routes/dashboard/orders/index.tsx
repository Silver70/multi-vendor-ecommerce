"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { DataTable } from "~/components/data-table";
import { Order, getOrdersQueryOptions, updateOrder } from "~/lib/ordersFn";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard/orders/")({
  component: RouteComponent,
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.prefetchQuery(getOrdersQueryOptions);
  },
});

const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "paid":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "shipped":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "delivered":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function RouteComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const {
    data: ordersResponse,
    isLoading: isQueryLoading,
    error: queryError,
  } = useQuery(getOrdersQueryOptions);

  const orders = ordersResponse?.items || [];

  if (isQueryLoading) return <div>Loading...</div>;

  if (queryError) return <div>Error: {queryError.message}</div>;

  const handleCancelOrderClick = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;

    setIsLoading(true);
    setError(null);

    try {
      await updateOrder({
        data: {
          id: orderToCancel,
          order: { status: "cancelled" },
        },
      });

      // Invalidate and refetch orders
      await queryClient.invalidateQueries(getOrdersQueryOptions);

      // Show success toast
      toast.success("Order cancelled successfully");
      setCancelDialogOpen(false);
      setOrderToCancel(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to cancel order";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatusClick = (orderId: string, currentStatus: string) => {
    setOrderToUpdate(orderId);
    setNewStatus(currentStatus);
    setUpdateStatusDialogOpen(true);
  };

  const handleConfirmUpdateStatus = async () => {
    if (!orderToUpdate || !newStatus) return;

    const currentOrder = orders.find((o) => o.id === orderToUpdate);
    if (!currentOrder) return;

    // Don't update if status hasn't changed
    if (currentOrder.status === newStatus) {
      setUpdateStatusDialogOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await updateOrder({
        data: {
          id: orderToUpdate,
          order: { status: newStatus as "pending" | "paid" | "shipped" | "delivered" | "cancelled" },
        },
      });

      // Invalidate and refetch orders
      await queryClient.invalidateQueries(getOrdersQueryOptions);

      // Show success toast
      toast.success(`Order status updated to ${newStatus}`);
      setUpdateStatusDialogOpen(false);
      setOrderToUpdate(null);
      setNewStatus("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update order status";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => {
        const id = row.getValue("id") as string;
        return <div className="font-mono text-xs">{id.slice(0, 8)}...</div>;
      },
    },
    {
      id: "customer",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const customer = row.original.customer;
        return (
          <div>
            <div className="font-medium">{customer?.fullName || "N/A"}</div>
            {customer?.email && (
              <div className="text-xs text-muted-foreground">
                {customer.email}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusColor(status)}`}
          >
            {status}
          </div>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = row.getValue("totalAmount") as number;
        return <div className="font-medium">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Order Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return <div className="text-sm">{formatDate(date)}</div>;
      },
    },
    {
      accessorKey: "address",
      header: "Shipping Address",
      cell: ({ row }) => {
        const address = row.getValue("address") as Order["address"];
        if (!address) return <div className="text-muted-foreground">N/A</div>;

        return (
          <div className="max-w-xs truncate text-sm text-muted-foreground">
            {address.city}, {address.country}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original;

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
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(order.id)}
              >
                Copy order ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  navigate({
                    to: "/dashboard/orders/$orderId",
                    params: { orderId: order.id },
                  })
                }
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  handleUpdateStatusClick(order.id, order.status)
                }
                disabled={order.status === "cancelled"}
              >
                Update status
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`text-red-600 ${
                  order.status === "cancelled"
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : ""
                }`}
                onClick={() => handleCancelOrderClick(order.id)}
                disabled={order.status === "cancelled"}
              >
                {order.status === "cancelled" ? "Already cancelled" : "Cancel order"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Get unique statuses from fetched orders
  const statuses = Array.from(
    new Set(
      orders.map((o: Order) => o.status).filter((s): s is string => s != null)
    )
  );

  // Filter orders based on search and filters (client-side filtering)
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer?.fullName &&
        order.customer.fullName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (order.customer?.email &&
        order.customer.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(order.status);
    return matchesSearch && matchesStatus;
  });

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, customer name, or email..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="w-full pl-9"
          />
        </div>

        {/* Filter and Add Order Buttons */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {selectedStatuses.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {selectedStatuses.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              {statuses.map((status: string) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={() => toggleStatus(status)}
                >
                  <span className="capitalize">{status}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add New Order Button */}
          <Button
            className="gap-2"
            onClick={() => navigate({ to: "/dashboard/orders/create" })}
          >
            <Plus className="h-4 w-4" />
            Add Order
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable columns={columns} data={filteredOrders} />

      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action will
              restore the product stock and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isLoading}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancelOrder}
              disabled={isLoading}
            >
              {isLoading ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateStatusDialogOpen} onOpenChange={setUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Select a new status for this order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateStatusDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUpdateStatus}
              disabled={isLoading || newStatus === orders.find((o) => o.id === orderToUpdate)?.status}
            >
              {isLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
