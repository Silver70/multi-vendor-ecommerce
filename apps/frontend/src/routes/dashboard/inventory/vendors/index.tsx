import { createFileRoute } from "@tanstack/react-router";
import { vendorQueries } from "~/lib/queries/vendors";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Filter, Plus, MoreHorizontal } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { CreateVendorModal } from "~/components/CreateVendorModal";

export const Route = createFileRoute("/dashboard/inventory/vendors/")({
  component: RouteComponent,
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.prefetchQuery(vendorQueries.getAll());
  },
});

function RouteComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: vendorsResponse } = useQuery(vendorQueries.getAll());
  const vendors = vendorsResponse?.items || [];

  // Filter logic
  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = vendor.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedVendors.length === 0 || selectedVendors.includes(vendor.id);
    return matchesSearch && matchesFilter;
  });

  const toggleVendorFilter = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  return (
    <div className="container mx-auto py-2">
      {/* Header with Search and Actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="w-full pl-9"
          />
        </div>

        {/* Filter and Add Vendor Buttons */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {selectedVendors.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {selectedVendors.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Show Vendors</DropdownMenuLabel>
              {vendors.map((vendor) => (
                <DropdownMenuCheckboxItem
                  key={vendor.id}
                  checked={selectedVendors.includes(vendor.id)}
                  onCheckedChange={() => toggleVendorFilter(vendor.id)}
                >
                  {vendor.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add New Vendor Button */}
          <Button
            className="gap-2"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((vendor) => (
          <Card
            key={vendor.id}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <CardTitle className="text-lg font-semibold">
                {vendor.name}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(vendor.id)}
                  >
                    Copy ID
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    View Products
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Contact Email */}
              {vendor.contactEmail && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Contact Email
                  </div>
                  <div className="text-sm break-all">{vendor.contactEmail}</div>
                </div>
              )}

              {/* Website */}
              {vendor.website && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Website</div>
                  <div className="text-sm break-all">
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {vendor.website}
                    </a>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="space-y-2 pt-2 border-t">
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant="outline">Active</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredVendors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            {vendors.length === 0
              ? "No vendors found."
              : "No vendors match your filters."}
          </p>
        </div>
      )}

      {/* Summary */}
      {filteredVendors.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          Showing {filteredVendors.length} of {vendors.length} vendors
        </div>
      )}

      {/* Create Vendor Modal */}
      <CreateVendorModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}
