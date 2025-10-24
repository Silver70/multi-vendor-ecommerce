import { createFileRoute } from "@tanstack/react-router";
import { categoryQueries } from "~/lib/queries/categories";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";

export const Route = createFileRoute("/dashboard/inventory/category")({
  component: RouteComponent,
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.prefetchQuery(categoryQueries.getAll());
  },
});

function RouteComponent() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories</h1>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead className="w-32">Products</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parentCategories.map((category) => {
              const subcats = subcategoriesByParent.get(category.id) || [];
              const totalProducts =
                category.productCount +
                subcats.reduce((sum, sub) => sum + sub.productCount, 0);

              return (
                <div key={category.id}>
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-semibold">
                      {category.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{totalProducts} products</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Active</Badge>
                    </TableCell>
                  </TableRow>

                  {/* Subcategories */}
                  {subcats.length > 0 && (
                    <>
                      {subcats.map((subcat) => (
                        <TableRow key={subcat.id} className="bg-gray-25">
                          <TableCell className="pl-8">
                            ↳ {subcat.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {subcat.productCount} products
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Active</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </div>
              );
            })}

            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <p className="text-gray-500">No categories found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-gray-600">
        Total Categories: {categories.length} | Total Product Count:{" "}
        {categories.reduce((sum, c) => sum + c.productCount, 0)}
      </p>
    </div>
  );
}
