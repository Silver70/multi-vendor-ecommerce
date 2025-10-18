import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/inventory/category')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/inventory/category"!</div>
}
