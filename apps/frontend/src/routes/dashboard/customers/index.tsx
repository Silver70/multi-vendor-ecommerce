import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  AlertCircle,
} from "lucide-react";

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
import { DataTable } from "~/components/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { CustomerDto, customerQueries, useDeleteCustomer } from "~/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { CreateCustomerModal } from "~/components/CreateCustomerModal";
import { UpdateCustomerModal } from "~/components/UpdateCustomerModal";

export const Route = createFileRoute("/dashboard/customers/")({
  component: RouteComponent,
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.prefetchQuery(customerQueries.getAll());
  },
});

function RouteComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedCustomerForUpdate, setSelectedCustomerForUpdate] =
    useState<CustomerDto | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    customerId: string;
    customerName: string;
  } | null>(null);

  //@ts-ignore
  const { data: customersResponse, isLoading: isQueryLoading } = useQuery(
    customerQueries.getAll()
  );

  const deleteCustomerMutation = useDeleteCustomer();

  const customers = customersResponse?.items || [];

  if (isQueryLoading) return <div>Loading...</div>;

  const columns: ColumnDef<CustomerDto>[] = [
    {
      accessorKey: "fullName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("fullName")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div>{row.getValue("email") || "N/A"}</div>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <div>{row.getValue("phone") || "N/A"}</div>,
    },
    {
      accessorKey: "isFromWebsite",
      header: "Source",
      cell: ({ row }) => {
        const isFromWebsite = row.getValue("isFromWebsite") as boolean;
        return (
          <div
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isFromWebsite
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            {isFromWebsite ? "Website" : "Admin"}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt") as string);
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const customer = row.original;

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
                onClick={() => navigator.clipboard.writeText(customer.id)}
              >
                Copy customer ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCustomerForUpdate(customer);
                  setUpdateModalOpen(true);
                }}
              >
                Edit customer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() =>
                  setDeleteConfirmation({
                    customerId: customer.id,
                    customerName: customer.fullName,
                  })
                }
              >
                Delete customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Get unique sources from fetched customers
  const sources = Array.from(
    new Set(
      customers
        .map((c: CustomerDto) => (c.isFromWebsite ? "Website" : "Admin"))
        .filter(
          (source: string | null | undefined): source is string =>
            source != null
        )
    )
  );

  // Filter customers based on search and filters (client-side filtering)
  const filteredCustomers = customers.filter((customer: CustomerDto) => {
    const matchesSearch =
      customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);

    const matchesSource =
      selectedSource.length === 0 ||
      (selectedSource.includes("Website") && customer.isFromWebsite) ||
      (selectedSource.includes("Admin") && !customer.isFromWebsite);

    return matchesSearch && matchesSource;
  });

  const toggleSource = (source: string) => {
    setSelectedSource((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    );
  };

  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="w-full pl-9"
          />
        </div>

        {/* Filter and Add Customer Buttons */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {selectedSource.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {selectedSource.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Source</DropdownMenuLabel>
              {sources.map((source: string) => (
                <DropdownMenuCheckboxItem
                  key={source}
                  checked={selectedSource.includes(source)}
                  onCheckedChange={() => toggleSource(source)}
                >
                  {source}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add New Customer Button */}
          <Button
            className="gap-2"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Customers Table */}
      <DataTable columns={columns} data={filteredCustomers} />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-600">Delete Customer</CardTitle>
              </div>
              <CardDescription className="mt-2">
                Are you sure you want to delete "
                {deleteConfirmation.customerName}"?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                This action cannot be undone. The customer record will be
                permanently removed from the system.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmation(null)}
                  disabled={deleteCustomerMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    deleteCustomerMutation.mutate(deleteConfirmation.customerId)
                  }
                  disabled={deleteCustomerMutation.isPending}
                >
                  {deleteCustomerMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </div>
              {deleteCustomerMutation.isError && (
                <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  Error deleting customer. Please try again or check if the
                  customer has associated orders.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Customer Modal */}
      <CreateCustomerModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {/* Update Customer Modal */}
      <UpdateCustomerModal
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        customer={selectedCustomerForUpdate}
      />
    </div>
  );
}
