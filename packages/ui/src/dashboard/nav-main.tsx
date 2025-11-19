import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@aws-ticket/ui/sidebar";
import type { Icon } from "@tabler/icons-react";
import { UseNavigateResult } from "@tanstack/react-router"
export function NavMain({
  items,
  navigateFn
}: {
  items: Array<{
    title: string;
    url: string;
    icon?: Icon;
  }>;
  navigateFn: UseNavigateResult<string>;

}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                className="cursor-pointer"
                onClick={() => navigateFn({ to: item.url })}
                tooltip={item.title}
              >
                {item.icon && <item.icon />}
                <span className="font-medium">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
