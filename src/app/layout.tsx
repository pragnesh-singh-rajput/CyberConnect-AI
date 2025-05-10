
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarSeparator,
  SidebarTrigger // Added SidebarTrigger
} from '@/components/ui/sidebar';
import AppSidebarNav from '@/components/layout/sidebar-nav';
import { ThemeProvider } from '@/components/theme-provider';
import Link from 'next/link';
import { AppProviders } from './providers'; 
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils'; // Added for conditional classnames

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CyberConnect AI',
  description: 'AI-powered recruiter outreach and email personalization.',
  icons: {
    icon: '/favicon.ico', // Example, ensure favicon exists or remove/update
  }, 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppProviders> 
            <SidebarProvider defaultOpen={true}>
              <Sidebar collapsible="icon"> {/* Set sidebar to collapse to icons */}
                <SidebarHeader className="p-4">
                  <Link href="/" className="flex items-center gap-2">
                    <svg width="32" height="32" viewBox="0 0 100 100" fill="hsl(var(--accent))" xmlns="http://www.w3.org/2000/svg" className="text-accent">
                      <path d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90V80C33.4315 80 20 66.5685 20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50H90C90 27.9086 72.0914 10 50 10ZM50 30C38.9543 30 30 38.9543 30 50C30 61.0457 38.9543 70 50 70C61.0457 70 70 61.0457 70 50C70 38.9543 61.0457 30 50 30ZM55 45V55H45V45H55Z" />
                      <circle cx="50" cy="50" r="7" fill="hsl(var(--background))"/>
                    </svg>
                    {/* Title hides when sidebar is collapsed on non-mobile screens */}
                    <h1 className={cn(
                        "text-xl font-semibold text-foreground",
                        "group-data-[state=collapsed]:hidden" // Uses parent group state
                      )}>
                        CyberConnect AI
                      </h1>
                  </Link>
                </SidebarHeader>
                <SidebarContent className="flex-grow">
                  <AppSidebarNav items={siteConfig.mainNav} />
                </SidebarContent>
                {siteConfig.secondaryNav && siteConfig.secondaryNav.length > 0 && (
                  <>
                    <SidebarSeparator className="my-2"/>
                    <SidebarFooter className="p-2"> {/* Reduced padding for footer items */}
                      <AppSidebarNav items={siteConfig.secondaryNav} />
                    </SidebarFooter>
                  </>
                )}
              </Sidebar>
              <SidebarInset> {/* This is a <main> tag, and flex flex-col */}
                {/* Header for the main content area, includes the SidebarTrigger */}
                <div className="flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-10 shrink-0">
                  <SidebarTrigger />
                  {/* You can add other header elements here, like breadcrumbs or a global search bar */}
                </div>
                {/* Scrollable content area */}
                <div className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
          </AppProviders>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
