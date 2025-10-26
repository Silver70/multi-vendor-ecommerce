import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { CustomSelect } from "~/components/ui/custom-select";
import { AlertCircle } from "lucide-react";
import {
  categoryQueries,
  useCreateCategory,
  type CreateCategoryDto,
} from "~/lib/queries";
import {
  buildCategoryHierarchy,
  flattenCategoryHierarchy,
} from "~/lib/utils/category-hierarchy";

interface CreateCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CategoryFormData {
  name: string;
  parentId?: string;
}

export function CreateCategoryModal({
  open,
  onOpenChange,
}: CreateCategoryModalProps) {
  const queryClient = useQueryClient();
  const { data: categoriesResponse } = useQuery(categoryQueries.getAll());
  const createCategoryMutation = useCreateCategory();

  const allCategories = categoriesResponse?.items || [];

  // Build hierarchical category structure for parent selection
  const parentCategoryOptions = Array.from(
    new Set(
      allCategories.length === 0
        ? []
        : flattenCategoryHierarchy(buildCategoryHierarchy(allCategories))
    )
  );

  const { register, watch, setValue, handleSubmit, reset, formState } =
    useForm<CategoryFormData>({
      defaultValues: {
        name: "",
        parentId: "",
      },
    });

  const parentId = watch("parentId");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    const categoryData: CreateCategoryDto = {
      name: data.name,
      parentId: data.parentId ? (data.parentId as any) : undefined,
      // Slug is optional - backend will auto-generate if not provided
    };

    createCategoryMutation.mutate(categoryData, {
      onSuccess: () => {
        // Invalidate categories query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        reset();
        onOpenChange(false);
        setIsSubmitting(false);
      },
      onError: () => {
        setIsSubmitting(false);
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>
            Create a new product category. The slug will be auto-generated from
            the name.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Electronics, Clothing"
              {...register("name", {
                required: "Category name is required",
                maxLength: {
                  value: 100,
                  message: "Name cannot exceed 100 characters",
                },
              })}
            />
            {formState.errors.name && (
              <p className="text-sm text-red-600">
                {formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Parent Category */}
          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Category (Optional)</Label>
            <CustomSelect
              id="parentId"
              value={parentId || ""}
              onChange={(value) => setValue("parentId", value || "")}
              placeholder="No parent (top-level category)"
              options={
                parentCategoryOptions.length > 0
                  ? parentCategoryOptions.map((category) => ({
                      value: category.id,
                      label: category.displayName,
                    }))
                  : []
              }
              disabled={parentCategoryOptions.length === 0}
            />
            <p className="text-xs text-muted-foreground">
              Select a parent to create a subcategory. Leave empty for a
              top-level category.
            </p>
          </div>

          {/* Error Message */}
          {createCategoryMutation.isError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-red-800 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                {createCategoryMutation.error instanceof Error
                  ? createCategoryMutation.error.message
                  : "Failed to create category. Please try again."}
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
              {isSubmitting ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
