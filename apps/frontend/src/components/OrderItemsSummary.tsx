"use client"

import * as React from "react"
import { OrderItemInput } from "~/components/ProductVariantSearch"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { Trash2, Edit2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"

interface OrderItemsSummaryProps {
  items: OrderItemInput[]
  onRemoveItem: (itemId: string) => void
  onUpdateQuantity: (itemId: string, quantity: number) => void
}

export function OrderItemsSummary({
  items,
  onRemoveItem,
  onUpdateQuantity,
}: OrderItemsSummaryProps) {
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null)
  const [editQuantity, setEditQuantity] = React.useState(1)

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)

  const handleEditQuantity = (itemId: string, currentQuantity: number) => {
    setEditingItemId(itemId)
    setEditQuantity(currentQuantity)
  }

  const handleSaveQuantity = (itemId: string) => {
    if (editQuantity > 0) {
      onUpdateQuantity(itemId, editQuantity)
    }
    setEditingItemId(null)
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No items added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add products to get started
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Items ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Desktop view - Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.productName}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.variantSku}</Badge>
                  </TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {editingItemId === item.id ? (
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            min="1"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                            className="w-16 text-center"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveQuantity(item.id)}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium">{item.quantity}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${item.subtotal.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {editingItemId !== item.id && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditQuantity(item.id, item.quantity)}
                          title="Edit quantity"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveItem(item.id)}
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile view - Cards */}
        <div className="md:hidden space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.productName}</div>
                  <Badge variant="outline" className="mt-1">
                    {item.variantSku}
                  </Badge>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveItem(item.id)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Price</span>
                  <div className="font-medium">${item.price.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Quantity</span>
                  <div className="font-medium">{item.quantity}</div>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">Subtotal</span>
                  <div className="font-medium">${item.subtotal.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEditQuantity(item.id, item.quantity)}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>

              {editingItemId === item.id && (
                <div className="flex gap-2 pt-2">
                  <Input
                    type="number"
                    min="1"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSaveQuantity(item.id)}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total Amount</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
