
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem, IconName } from '@/config/site'; // Import IconName
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  LineChart, 
  Settings, 
  UserCircle,
  type LucideIcon
} from 'lucide-react';

interface AppSidebarNavProps {
  items: NavItem[];
}

// Map icon names to actual Lucide components
const iconMap: Record<IconName, LucideIcon> = {
  LayoutDashboard,
  Users,
  FileText,
  LineChart,
  Settings,
  UserCircle,
};

export default function AppSidebarNav({ items }: AppSidebarNavProps) {
  const pathname = usePathname();
  const { isMobile, state: sidebarState } = useSidebar();

  if (!items?.length) {
    return null;
  }

  return (
    <SidebarMenu>
      {items.map((item, index) => {
        const IconComponent = iconMap[item.iconName]; // Get the component from the map
        return (
          <SidebarMenuItem key={index}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                tooltip={item.title}
                className="w-full"
                aria-label={item.title}
                disabled={item.disabled}
              >
                {IconComponent && <IconComponent className="h-5 w-5" />} {/* Render the fetched component */}
                <span className={cn(
                  "ml-2",
                  sidebarState === 'collapsed' && !isMobile ? 'hidden' : 'inline'
                )}>
                  {item.title}
                </span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
