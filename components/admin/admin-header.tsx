'use client'

import { usePathname } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Search, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/blog': 'Blog',
  '/admin/newsletter': 'Newsletter',
  '/admin/referrals': 'Referrals',
}

const pageDescriptions: Record<string, string> = {
  '/admin': 'Monitor your engagement metrics and performance',
  '/admin/blog': 'Manage blog posts and content',
  '/admin/newsletter': 'Manage newsletter subscribers',
  '/admin/referrals': 'Manage referral codes and rewards',
}

export function AdminHeader() {
  const pathname = usePathname()
  const pageTitle = pageTitles[pathname] || 'Dashboard'

  return (
    <header className="sticky top-0 z-10 flex flex-col border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="flex h-14 items-center gap-4 px-4">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin" className="text-muted-foreground hover:text-foreground">
                PostEngage
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathname !== '/admin' && (
              <>
                <BreadcrumbSeparator className="text-muted-foreground/50" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-foreground">{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative hidden md:flex w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="h-9 pl-8 bg-secondary/50 border-border focus:bg-secondary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Help */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary">
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Help</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
           {/* Placeholder for future notifications */}
        </DropdownMenu>
      </div>
    </header>
  )
}
