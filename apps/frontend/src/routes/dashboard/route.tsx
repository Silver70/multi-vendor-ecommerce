import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { requireAuth } from "~/middleware/auth";
import { useAuth } from "~/context/AuthContext";
import { useEffect } from "react";
import { AppSidebar } from "~/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ThemeToggle } from "~/components/theme-toggle";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  component: RouteComponent,
});

function RouteComponent() {
  // @ts-ignore
  const { loading, isSignedIn } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not signed in
  useEffect(() => {
    if (!loading && !isSignedIn) {
      navigate({ to: "/auth/login" });
    }
  }, [loading, isSignedIn, navigate]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2 px-4">
            <ThemeToggle />
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/shadcn.jpg" alt="User" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <Separator className="my-2" />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
