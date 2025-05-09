import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, MailPlus, LineChart, FileText } from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
};

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  mainNav: NavItem[];
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
      icon: LayoutDashboard,
    },
    {
      title: "Recruits",
      href: "/recruits",
      icon: Users,
    },
    {
      title: "Templates",
      href: "/templates",
      icon: FileText,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: LineChart,
    },
  ],
};
