import * as React from "react";
import { Icon, IconInnerShadowTop } from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@aws-ticket/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { UseNavigateResult } from "@tanstack/react-router";

export function AppSidebar({
  data,
  navigateFn,
  ...props
}: {
  data: {
    user: {
      name: string;
      email: string;
      avatar: string;
    };
    navMain: Array<{
      title: string;
      url: string;
      icon: Icon;
    }>;
  };
  navigateFn: UseNavigateResult<string>;
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <img src="/logo.webp" className="w-10 h-10" alt="logo" />
                <span className="uppercase text-base font-extrabold text-primary">
                  AWS Ticket
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="mt-4">
        <NavMain items={data.navMain} navigateFn={navigateFn} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
