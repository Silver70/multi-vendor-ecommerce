import { createFileRoute, useNavigate, useMatches } from "@tanstack/react-router";
import { Outlet, Link } from "@tanstack/react-router";
import { requireAuth } from "~/middleware/auth";
import { useAuth } from "~/context/AuthContext";
import { useEffect, useMemo } from "react";
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

// Helper function to format route segment into readable label
function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function RouteComponent() {
  // @ts-ignore
  const { loading, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const matches = useMatches();

  // Redirect to login if not signed in
  useEffect(() => {
    if (!loading && !isSignedIn) {
      navigate({ to: "/auth/login" });
    }
  }, [loading, isSignedIn, navigate]);

  // Generate breadcrumbs from route matches
  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ label: string; path: string; isLast: boolean }> = [];

    // Always add Dashboard as the first crumb
    crumbs.push({
      label: "Dashboard",
      path: "/dashboard/overview",
      isLast: false,
    });

    // Get the current pathname
    const currentMatch = matches[matches.length - 1];
    if (currentMatch && currentMatch.pathname !== "/dashboard") {
      // Split the path and filter out empty strings and "dashboard"
      const segments = currentMatch.pathname
        .split("/")
        .filter((segment) => segment && segment !== "dashboard");

      // Build breadcrumbs from segments
      segments.forEach((segment, index) => {
        const isLast = index === segments.length - 1;
        const path = `/dashboard/${segments.slice(0, index + 1).join("/")}`;

        crumbs.push({
          label: formatSegment(segment),
          path,
          isLast,
        });
      });
    } else {
      // If we're on the dashboard root, show Overview
      crumbs.push({
        label: "Overview",
        path: "/dashboard/overview",
        isLast: true,
      });
    }

    return crumbs;
  }, [matches]);

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
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.path} className="contents">
                    <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                      {crumb.isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.path}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!crumb.isLast && (
                      <BreadcrumbSeparator className={index === 0 ? "hidden md:block" : ""} />
                    )}
                  </div>
                ))}
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
