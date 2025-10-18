import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getOrdersQueryOptions } from "~/lib/ordersFn";

export const Route = createFileRoute("/dashboard/orders/")({
  beforeLoad: ({ context }) => {
    const { queryClient } = context;
    const orders = queryClient.ensureQueryData(getOrdersQueryOptions);
    return orders;
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data: orders } = useQuery(getOrdersQueryOptions);
  return <div>Hello "/dashboard/orders/"!</div>;
}
