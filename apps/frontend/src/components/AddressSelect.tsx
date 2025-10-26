"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addressQueries,
  useCreateAddress,
  type AddressDto,
  type CreateAddressDto,
} from "~/lib/queries";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { CustomSelect } from "~/components/ui/custom-select";
import { AlertCircle, Plus } from "lucide-react";

interface AddressSelectProps {
  customerId: string | null;
  value: AddressDto | null;
  onValueChange: (address: AddressDto | null) => void;
  label?: string;
}

export function AddressSelect({
  customerId,
  value,
  onValueChange,
  label = "Select Address",
}: AddressSelectProps) {
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  });

  const { data: addressesData, isLoading } = useQuery(
    customerId
      ? addressQueries.getForCustomer(customerId)
      : (({
          queryKey: ["addresses", "null"],
          queryFn: async () => ({ items: [] } as any),
          enabled: false,
        } as any) as ReturnType<typeof addressQueries.getForCustomer>)
  );

  const addresses = addressesData?.items || [];

  // Auto-select single address when customer is selected
  React.useEffect(() => {
    if (customerId && addresses.length === 1 && !value) {
      onValueChange(addresses[0]);
    }
  }, [customerId, addresses, value, onValueChange]);

  const createAddressMutation = useCreateAddress();

  const handleCreateAddress = () => {
    if (!customerId) return;

    if (
      !formData.fullName ||
      !formData.line1 ||
      !formData.city ||
      !formData.country
    ) {
      return;
    }

    createAddressMutation.mutate(
      {
        customerId,
        ...formData,
      },
      {
        onSuccess: (newAddress) => {
          onValueChange(newAddress);
          setShowCreateForm(false);
          setFormData({
            fullName: "",
            line1: "",
            line2: "",
            city: "",
            postalCode: "",
            country: "",
            phone: "",
          });
        },
      }
    );
  };

  if (!customerId) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 flex gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-800 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">Select a customer first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {isLoading ? (
        <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
          Loading addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div className="space-y-3">
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-blue-800 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              No addresses found for this customer. Create one to continue.
            </p>
          </div>
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button type="button" variant="default" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Address
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Address</DialogTitle>
                <DialogDescription>
                  Add a new delivery address for this customer
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line1">Address Line 1 *</Label>
                  <Input
                    id="line1"
                    placeholder="123 Main St"
                    value={formData.line1}
                    onChange={(e) =>
                      setFormData({ ...formData, line1: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line2">Address Line 2</Label>
                  <Input
                    id="line2"
                    placeholder="Apt 4B (optional)"
                    value={formData.line2}
                    onChange={(e) =>
                      setFormData({ ...formData, line2: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      placeholder="10001"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    placeholder="United States"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateAddress}
                    disabled={
                      createAddressMutation.isPending ||
                      !formData.fullName ||
                      !formData.line1 ||
                      !formData.city ||
                      !formData.country
                    }
                  >
                    {createAddressMutation.isPending
                      ? "Creating..."
                      : "Create Address"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {createAddressMutation.isError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-red-800 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                Failed to create address. Please try again.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <CustomSelect
            value={value?.id || ""}
            onChange={(selectedId) => {
              const selected = addresses.find((a) => a.id === selectedId);
              onValueChange(selected || null);
            }}
            placeholder={
              value
                ? `${value.fullName}, ${value.city}, ${value.country}`
                : "Select an address..."
            }
            options={addresses.map((address) => ({
              value: address.id,
              label: `${address.fullName} - ${address.line1}, ${address.city}, ${address.country}`,
            }))}
            className="flex-1"
          />

          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Create new address"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Address</DialogTitle>
                <DialogDescription>
                  Add a new delivery address for this customer
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line1">Address Line 1 *</Label>
                  <Input
                    id="line1"
                    placeholder="123 Main St"
                    value={formData.line1}
                    onChange={(e) =>
                      setFormData({ ...formData, line1: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line2">Address Line 2</Label>
                  <Input
                    id="line2"
                    placeholder="Apt 4B (optional)"
                    value={formData.line2}
                    onChange={(e) =>
                      setFormData({ ...formData, line2: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      placeholder="10001"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    placeholder="United States"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateAddress}
                    disabled={
                      createAddressMutation.isPending ||
                      !formData.fullName ||
                      !formData.line1 ||
                      !formData.city ||
                      !formData.country
                    }
                  >
                    {createAddressMutation.isPending
                      ? "Creating..."
                      : "Create Address"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {createAddressMutation.isError && addresses.length > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 flex gap-2">
          <AlertCircle className="h-4 w-4 text-red-800 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">
            Failed to create address. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}
