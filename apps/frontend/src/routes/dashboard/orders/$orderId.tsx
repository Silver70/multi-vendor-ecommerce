import { createFileRoute } from "@tanstack/react-router";
import { getOrderQueryOptions } from "~/lib/ordersFn";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "~/components/ui/table";
import { Separator } from "~/components/ui/separator";
import { formatCurrency, formatDate } from "~/lib/utils";

export const Route = createFileRoute("/dashboard/orders/$orderId")({
  component: RouteComponent,
  loader(ctx) {
    const { queryClient } = ctx.context;
    queryClient.prefetchQuery(getOrderQueryOptions(ctx.params.orderId));
  },
});

const getStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "paid":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "shipped":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100";
    case "delivered":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "cancelled":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    default:
      return "";
  }
};

function RouteComponent() {
  const {
    data: orderResponse,
    isLoading,
    error,
  } = useQuery(getOrderQueryOptions(Route.useParams().orderId));
  console.log(orderResponse);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderResponse) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">ACME Store</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Invoice for Order
              </p>
            </div>
            <Badge className={getStatusStyle(orderResponse.status)}>
              {orderResponse.status.toUpperCase()}
            </Badge>
          </div>

          <Separator />

          {/* Order Info Section */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                ORDER ID
              </h3>
              <p className="text-sm font-mono">{orderResponse.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                ORDER DATE
              </h3>
              <p className="text-sm">{formatDate(orderResponse.createdAt)}</p>
            </div>
          </div>

          <Separator />

          {/* Customer Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                CUSTOMER
              </h3>
              <p className="text-sm font-medium">
                {orderResponse.address?.fullName || orderResponse.userName}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                SHIPPING ADDRESS
              </h3>
              {orderResponse.address ? (
                <div className="text-sm space-y-1">
                  <p>{orderResponse.address.line1}</p>
                  {orderResponse.address.line2 && (
                    <p>{orderResponse.address.line2}</p>
                  )}
                  <p>
                    {orderResponse.address.city}
                    {orderResponse.address.postalCode &&
                      `, ${orderResponse.address.postalCode}`}
                  </p>
                  <p>{orderResponse.address.country}</p>
                  {orderResponse.address.phone && (
                    <p className="text-muted-foreground">
                      Phone: {orderResponse.address.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No address available
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Separator />

          {/* Order Items Table */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">
              ORDER ITEMS
            </h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderResponse.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {item.productName || "Product"}
                          </p>
                          {item.variantSku && (
                            <p className="text-sm text-muted-foreground">
                              SKU: {item.variantSku}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Total Amount
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {formatCurrency(orderResponse.totalAmount)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>

          <Separator />

          {/* Payment Method Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              PAYMENT METHOD
            </h3>
            {/* @ts-ignore */}
            <p>{orderResponse.payments?.[0].method}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
