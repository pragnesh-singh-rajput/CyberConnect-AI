'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { siteConfig, type NavItem } from '@/config/site';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'; // Ensure TooltipProvider is used at a higher level if not already
import { useSidebar } from '@/components/ui/sidebar';


export default function AppSidebarNav() {
  const pathname = usePathname();
  const { isMobile, state: sidebarState } = useSidebar();


  if (!siteConfig.mainNav?.length) {
    return null;
  }

  return (
    <SidebarMenu>
      {siteConfig.mainNav.map((item, index) => (
        <SidebarMenuItem key={index}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={pathname === item.href}
              tooltip={item.title}
              className="w-full"
              aria-label={item.title}
            >
              <item.icon className="h-5 w-5" />
              <span className={cn(
                "ml-2",
                sidebarState === 'collapsed' && !isMobile ? 'hidden' : 'inline'
              )}>
                {item.title}
              </span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
