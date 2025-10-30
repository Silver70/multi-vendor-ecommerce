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
import {
  customerQueries,
  useCreateCustomer,
  type CreateCustomerDto,
} from "~/lib/queries";

interface CreateCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CustomerFormData {
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

export function CreateCustomerModal({
  open,
  onOpenChange,
}: CreateCustomerModalProps) {
  const queryClient = useQueryClient();
  const createCustomerMutation = useCreateCustomer();

  const { register, handleSubmit, reset, formState } = useForm<CustomerFormData>(
    {
      defaultValues: {
        fullName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
      },
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    const customerData: CreateCustomerDto = {
      fullName: data.fullName,
      email: data.email || undefined,
      phone: data.phone || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
    };

    createCustomerMutation.mutate(customerData, {
      onSuccess: () => {
        // Invalidate customers query to refresh the list
        queryClient.invalidateQueries({ queryKey: customerQueries.lists() });
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
          <DialogTitle>Create New Customer</DialogTitle>
          <DialogDescription>
            Add a new customer to your system. Only the full name is required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="e.g., John Doe"
              {...register("fullName", {
                required: "Full name is required",
                maxLength: {
                  value: 100,
                  message: "Name cannot exceed 100 characters",
                },
              })}
            />
            {formState.errors.fullName && (
              <p className="text-sm text-red-600">
                {formState.errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g., john@example.com"
              {...register("email", {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                },
              })}
            />
            {formState.errors.email && (
              <p className="text-sm text-red-600">
                {formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., +1 (555) 123-4567"
              {...register("phone")}
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register("dateOfBirth")}
            />
          </div>

          {/* Error Message */}
          {createCustomerMutation.isError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-red-800 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                {createCustomerMutation.error instanceof Error
                  ? createCustomerMutation.error.message
                  : "Failed to create customer. Please try again."}
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
              {isSubmitting ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
