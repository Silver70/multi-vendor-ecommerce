import type * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  Box,
  Home,
  Settings,
  LogOut,
} from "lucide-react";
import { useClerk } from "@clerk/tanstack-react-start";
import { NavMain } from "~/components/nav-main";
import { NavProjects } from "~/components/nav-projects";
import { TeamSwitcher } from "~/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "~/components/ui/sidebar";
import { useNavigate } from "@tanstack/react-router";
import { Separator } from "@radix-ui/react-separator";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Home",
      url: "/dashboard/overview",
      icon: Home,
      isActive: false,
    },
    {
      title: "Inventory",
      url: "/dashboard/inventory",
      icon: Box,
      items: [
        {
          title: "Products",
          url: "/dashboard/inventory/products",
        },
        {
          title: "Categories",
          url: "/dashboard/inventory/categories",
        },
        {
          title: "Brands",
          url: "/dashboard/inventory/brands",
        },
      ],
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: BookOpen,
      items: [
        {
          title: "Orders",
          url: "/dashboard/orders",
        },
        {
          title: "Deliveries",
          url: "/dashboard/orders/deliveries",
        },
        {
          title: "Returns",
          url: "/dashboard/orders/returns",
        },
        {
          title: "Refunds",
          url: "/dashboard/orders/refunds",
        },
      ],
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: Settings2,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate({ to: "/auth/login" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#">
                <Settings />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#" onClick={handleLogout}>
                <LogOut />
                <span>Logout</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
