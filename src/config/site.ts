
import type { LucideProps } from 'lucide-react'; // For better typing if needed, but string keys are fine
import { LayoutDashboard, Users, MailPlus, LineChart, FileText, Settings, UserCircle } from 'lucide-react';

// Define a type for the icon names that we'll use as keys
export type IconName = 
  | 'LayoutDashboard' 
  | 'Users' 
  | 'FileText' 
  | 'LineChart' 
  | 'Settings' 
  | 'UserCircle';

export type NavItem = {
  title: string;
  href: string;
  iconName: IconName; // Changed from icon: LucideIcon to iconName: string
  disabled?: boolean;
};

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  mainNav: NavItem[];
  secondaryNav?: NavItem[]; // Optional secondary nav for items like settings/profile
};

export const siteConfig: SiteConfig = {
  name: "CyberConnect AI",
  description: "AI-powered recruiter outreach and email personalization.",
  url: "https://example.com", // Replace with your actual URL
  ogImage: "https://example.com/og.jpg", // Replace with your actual OG image URL
  mainNav: [
    {
      title: "Dashboard",
      href: "/",
      iconName: "LayoutDashboard",
    },
    {
      title: "Recruits",
      href: "/recruits",
      iconName: "Users",
    },
    {
      title: "Templates",
      href: "/templates",
      iconName: "FileText",
    },
    {
      title: "Analytics",
      href: "/analytics",
      iconName: "LineChart",
    },
  ],
  secondaryNav: [ 
     {
      title: "Settings",
      href: "/settings",
      iconName: "Settings",
    },
    {
      title: "Profile",
      href: "/profile",
      iconName: "UserCircle",
    },
  ]
};

