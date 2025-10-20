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
import { Product } from "~/types/product";
import { getProductsQueryOptions } from "~/lib/productFn";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard/inventory/products/")({
  component: RouteComponent,
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.prefetchQuery(getProductsQueryOptions);
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { data: productsResponse, isLoading } = useQuery(
    getProductsQueryOptions
  );

  const products = productsResponse?.items || [];

  if (isLoading) return <div>Loading...</div>;

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Product Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "categoryName",
      header: "Category",
      cell: ({ row }) => <div>{row.getValue("categoryName") || "N/A"}</div>,
    },
    {
      accessorKey: "vendorName",
      header: "Vendor",
      cell: ({ row }) => <div>{row.getValue("vendorName") || "N/A"}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return (
          <div className="max-w-xs truncate text-muted-foreground">
            {description || "No description"}
          </div>
        );
      },
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
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
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
        const product = row.original;

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
                onClick={() => navigator.clipboard.writeText(product.id)}
              >
                Copy product ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Edit product</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  navigate({
                    to: "/dashboard/inventory/products/$productId",
                    params: { productId: product.id },
                  })
                }
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Delete product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Get unique vendors and categories from fetched products
  const vendors = Array.from(
    new Set(
      products
        .map((p: Product) => p.vendorName)
        .filter(
          (name: string | null | undefined): name is string => name != null
        )
    )
  );
  const categories = Array.from(
    new Set(
      products
        .map((p: Product) => p.categoryName)
        .filter(
          (name: string | null | undefined): name is string => name != null
        )
    )
  );

  // Filter products based on search and filters (client-side filtering)
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesVendor =
      selectedVendors.length === 0 ||
      (product.vendorName && selectedVendors.includes(product.vendorName));
    const matchesCategory =
      selectedCategories.length === 0 ||
      (product.categoryName &&
        selectedCategories.includes(product.categoryName));
    return matchesSearch && matchesVendor && matchesCategory;
  });

  const toggleVendor = (vendor: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendor)
        ? prev.filter((v) => v !== vendor)
        : [...prev, vendor]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="w-full pl-9"
          />
        </div>

        {/* Filter and Add Product Buttons */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {(selectedVendors.length > 0 ||
                  selectedCategories.length > 0) && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {selectedVendors.length + selectedCategories.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Vendor</DropdownMenuLabel>
              {vendors.map((vendor: string) => (
                <DropdownMenuCheckboxItem
                  key={vendor}
                  checked={selectedVendors.includes(vendor)}
                  onCheckedChange={() => toggleVendor(vendor)}
                >
                  {vendor}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              {categories.map((category: string) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add New Product Button */}
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <DataTable columns={columns} data={filteredProducts} />
    </div>
  );
}
