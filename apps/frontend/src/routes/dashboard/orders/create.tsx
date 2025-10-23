"use client"

import * as React from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CustomerSearchSelect } from "~/components/CustomerSearchSelect"
import { AddressSelect } from "~/components/AddressSelect"
import {
  ProductVariantSearch,
  OrderItemInput,
} from "~/components/ProductVariantSearch"
import { OrderItemsSummary } from "~/components/OrderItemsSummary"
import { createOrder, CreateOrderDto } from "~/lib/ordersFn"
import { CustomerDto } from "~/lib/customersFn"
import { AddressDto } from "~/lib/addressFn"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"

export const Route = createFileRoute("/dashboard/orders/create")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerDto | null>(null)
  const [selectedAddress, setSelectedAddress] = React.useState<AddressDto | null>(null)
  const [orderItems, setOrderItems] = React.useState<OrderItemInput[]>([])

  const createOrderMutation = useMutation({
    mutationFn: async (data: CreateOrderDto) => {
      return await createOrder({ data })
    },
    onSuccess: (createdOrder) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      navigate({
        to: `/dashboard/orders/${createdOrder.id}`,
      })
    },
  })

  const handleAddItem = (item: OrderItemInput) => {
    setOrderItems([...orderItems, item])
  }

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId))
  }

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    setOrderItems(
      orderItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: newQuantity,
            subtotal: item.price * newQuantity,
          }
        }
        return item
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCustomer || !selectedAddress || orderItems.length === 0) {
      return
    }

    const orderData: CreateOrderDto = {
      customerId: selectedCustomer.id,
      addressId: selectedAddress.id,
      items: orderItems.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    }

    createOrderMutation.mutate(orderData)
  }

  const isFormValid =
    selectedCustomer && selectedAddress && orderItems.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Create Order</h1>
        <p className="text-muted-foreground">
          Create a new order by selecting a customer, address, and products
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Sidebar - Customer & Address Selection */}
          <div className="md:col-span-1 space-y-4">
            {/* Customer Selection Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CustomerSearchSelect
                  value={selectedCustomer}
                  onValueChange={setSelectedCustomer}
                  label="Customer"
                />

                {selectedCustomer && (
                  <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <div className="font-medium">{selectedCustomer.email || "No email"}</div>
                    </div>
                    {selectedCustomer.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <div className="font-medium">{selectedCustomer.phone}</div>
                      </div>
                    )}
                    <div className="text-xs pt-2 border-t">
                      <span className="text-muted-foreground">Created:</span>
                      <div>{new Date(selectedCustomer.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Selection Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery Address</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressSelect
                  customerId={selectedCustomer?.id || null}
                  value={selectedAddress}
                  onValueChange={setSelectedAddress}
                  label="Address"
                />

                {selectedAddress && (
                  <div className="mt-4 p-3 bg-muted rounded-md text-sm space-y-1">
                    <div className="font-medium">{selectedAddress.fullName}</div>
                    <div className="text-muted-foreground">
                      {selectedAddress.line1}
                      {selectedAddress.line2 && <>, {selectedAddress.line2}</>}
                    </div>
                    <div className="text-muted-foreground">
                      {selectedAddress.city}, {selectedAddress.country}
                      {selectedAddress.postalCode && <> {selectedAddress.postalCode}</>}
                    </div>
                    {selectedAddress.phone && (
                      <div className="text-muted-foreground">{selectedAddress.phone}</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Order Items */}
          <div className="md:col-span-2 space-y-4">
            {/* Add Items Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductVariantSearch onAddItem={handleAddItem} />
              </CardContent>
            </Card>

            {/* Items Summary Card */}
            <OrderItemsSummary
              items={orderItems}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
            />
          </div>
        </div>

        {/* Error Messages */}
        {createOrderMutation.isError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-800 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              {createOrderMutation.error instanceof Error
                ? createOrderMutation.error.message
                : "Failed to create order. Please try again."}
            </p>
          </div>
        )}

        {/* Success Message */}
        {createOrderMutation.isSuccess && (
          <div className="rounded-md bg-green-50 border border-green-200 p-4 flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-800 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              Order created successfully! Redirecting...
            </p>
          </div>
        )}

        {/* Form Validation Messages */}
        {!selectedCustomer && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-800 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">Please select a customer to proceed</p>
          </div>
        )}

        {selectedCustomer && !selectedAddress && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-800 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Please select or create a delivery address
            </p>
          </div>
        )}

        {selectedCustomer && selectedAddress && orderItems.length === 0 && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-800 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Please add at least one product to the order
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate({
                to: "/dashboard/orders",
              })
            }
            disabled={createOrderMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid || createOrderMutation.isPending}
            className="flex-1 md:flex-none"
          >
            {createOrderMutation.isPending ? "Creating Order..." : "Create Order"}
          </Button>
        </div>
      </form>
    </div>
  )
}
