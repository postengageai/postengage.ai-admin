'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  LogOut,
  ChevronDown,
  FileText,
  Mail,
  Ticket,
  Zap,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { hasPermission } from '@/lib/auth'
import { useUserStore } from '@/lib/user/store'
import { useAuthStore } from '@/lib/auth/store'
import { authApi } from '@/lib/api/auth'
import { useToast } from '@/components/ui/use-toast'

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permission: null,
  },
]

const engagementNavItems = [
  {
    title: 'Blog',
    href: '/admin/blog',
    icon: FileText,
    permission: 'blog.view',
  },
  {
    title: 'Newsletter',
    href: '/admin/newsletter',
    icon: Mail,
    permission: null,
  },
  {
    title: 'Referrals',
    href: '/admin/referrals',
    icon: Ticket,
    permission: null,
  },
]

const systemNavItems: any[] = []

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUserStore()
  const { clearAuth } = useAuthStore(state => state.actions)
  const { toast } = useToast()

  const displayName = user 
    ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email)
    : 'User'
    
  const avatarUrl = user?.avatar?.url || "/placeholder.svg"

  const handleLogout = async () => {
    try {
      await authApi.logout()
      clearAuth() // Clear client state
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
      toast({
        title: 'Logout failed',
        description: 'Please try again',
        variant: 'destructive',
      })
      // Force logout anyway
      clearAuth()
      router.push('/admin/login')
    }
  }

  const filterNavItems = (items: any[]) => {
    return items.filter(item => {
      if (!item.permission) return true
      return hasPermission(item.permission, user as any)
    })
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-foreground tracking-tight">PostEngage</span>
            <span className="text-[10px] text-muted-foreground">.ai</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70 px-2">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterNavItems(mainNavItems).map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="h-9 rounded-md data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-sidebar-accent"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2 bg-sidebar-border" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70 px-2">
            Engagement
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterNavItems(engagementNavItems).map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="h-9 rounded-md data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-sidebar-accent"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2 bg-sidebar-border" />

      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="h-12 rounded-md data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="h-8 w-8 rounded-md">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="rounded-md bg-primary/10 text-primary text-xs">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium text-foreground">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-popover border-border"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
