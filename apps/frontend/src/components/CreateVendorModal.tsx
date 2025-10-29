import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
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
import { AlertCircle } from "lucide-react";
import { useCreateVendor, type CreateVendorDto } from "~/lib/queries";

interface CreateVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VendorFormData {
  name: string;
  contactEmail?: string;
  website?: string;
}

export function CreateVendorModal({
  open,
  onOpenChange,
}: CreateVendorModalProps) {
  const queryClient = useQueryClient();
  const createVendorMutation = useCreateVendor();

  const { register, handleSubmit, reset, formState } = useForm<VendorFormData>(
    {
      defaultValues: {
        name: "",
        contactEmail: "",
        website: "",
      },
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    const vendorData: CreateVendorDto = {
      name: data.name,
      contactEmail: data.contactEmail || undefined,
      website: data.website || undefined,
    };

    createVendorMutation.mutate(vendorData, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["vendors"] });
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
          <DialogTitle>Create New Vendor</DialogTitle>
          <DialogDescription>
            Create a new vendor for your multi-vendor store.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Vendor Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Vendor Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Acme Corporation"
              {...register("name", {
                required: "Vendor name is required",
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

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="e.g., contact@vendor.com"
              {...register("contactEmail", {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
            {formState.errors.contactEmail && (
              <p className="text-sm text-red-600">
                {formState.errors.contactEmail.message}
              </p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website (Optional)</Label>
            <Input
              id="website"
              placeholder="e.g., https://vendor.com"
              {...register("website")}
            />
          </div>

          {/* Error Message */}
          {createVendorMutation.isError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-red-800 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                {createVendorMutation.error instanceof Error
                  ? createVendorMutation.error.message
                  : "Failed to create vendor. Please try again."}
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
              {isSubmitting ? "Creating..." : "Create Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
