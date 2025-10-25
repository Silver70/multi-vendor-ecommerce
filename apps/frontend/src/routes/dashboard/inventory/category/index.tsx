import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { categoryQueries } from "~/lib/queries/categories";
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

export const Route = createFileRoute("/dashboard/inventory/category/")({
  component: RouteComponent,
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.prefetchQuery(categoryQueries.getAll());
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParents, setSelectedParents] = useState<string[]>([]);

  const { data: categoriesResponse } = useQuery(categoryQueries.getAll());
  const categories = categoriesResponse?.items || [];

  // Separate parent and subcategories
  const parentCategories = categories.filter((c) => !c.parentId);
  const subcategoriesByParent = new Map(
    parentCategories.map((parent) => [
      parent.id,
      categories.filter((c) => c.parentId === parent.id),
    ])
  );

  // Filter logic
  const filteredParents = parentCategories.filter((category) => {
    const matchesSearch = category.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedParents.length === 0 || selectedParents.includes(category.id);
    return matchesSearch && matchesFilter;
  });

  const toggleParentFilter = (parentId: string) => {
    setSelectedParents((prev) =>
      prev.includes(parentId)
        ? prev.filter((id) => id !== parentId)
        : [...prev, parentId]
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
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="w-full pl-9"
          />
        </div>

        {/* Filter and Add Category Buttons */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {selectedParents.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {selectedParents.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Show Categories</DropdownMenuLabel>
              {parentCategories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category.id}
                  checked={selectedParents.includes(category.id)}
                  onCheckedChange={() => toggleParentFilter(category.id)}
                >
                  {category.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add New Category Button */}
          <Button
            className="gap-2"
            onClick={() =>
              navigate({ to: "/dashboard/inventory/category/create" })
            }
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParents.map((category) => {
          const subcats = subcategoriesByParent.get(category.id) || [];
          const totalProducts =
            category.productCount +
            subcats.reduce((sum, sub) => sum + sub.productCount, 0);

          return (
            <Card
              key={category.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-semibold">
                  {category.name}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(category.id)}
                    >
                      Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      Manage Products
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Product Count */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Product Count
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-base">
                      {totalProducts}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {subcats.length > 0 &&
                        `(${category.productCount} direct, ${subcats.reduce((sum, sub) => sum + sub.productCount, 0)} in subcategories)`}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant="outline">Active</Badge>
                </div>

                {/* Subcategories */}
                {subcats.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      Subcategories ({subcats.length})
                    </div>
                    <div className="space-y-1">
                      {subcats.map((subcat) => (
                        <div
                          key={subcat.id}
                          className="text-sm flex items-center justify-between"
                        >
                          <span>↳ {subcat.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {subcat.productCount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredParents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            {categories.length === 0
              ? "No categories found. Create one to get started!"
              : "No categories match your filters."}
          </p>
          {categories.length === 0 && (
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Create First Category
            </Button>
          )}
        </div>
      )}

      {/* Summary */}
      {filteredParents.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          Showing {filteredParents.length} of {parentCategories.length}{" "}
          categories | Total Products:{" "}
          {categories.reduce((sum, c) => sum + c.productCount, 0)}
        </div>
      )}
    </div>
  );
}
