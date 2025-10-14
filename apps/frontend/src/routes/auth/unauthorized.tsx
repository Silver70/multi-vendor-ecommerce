import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/unauthorized")({
  component: RouteComponent,
});

function RouteComponent() {
  return <p>you are not authorized to access this page</p>;
}
