'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, LogOut, ChevronDown, FileText, Mail, Ticket,
  Zap, Users, Bot, MessageSquare, Banknote, Package, Globe,
  BarChart3, Flag, Activity, Brain, Mic, BookOpen, CreditCard,
  Image, Bell, UserCheck, Receipt, Handshake, Terminal, ChevronRight,
  ArrowLeftRight, Sliders,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useUserStore } from '@/lib/user/store'
import { useAuthStore } from '@/lib/auth/store'
import { authApi } from '@/lib/api/auth'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'

const navGroups = [
  { label: 'Platform', defaultOpen: true, items: [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  ]},
  { label: 'Users & Auth', defaultOpen: true, items: [
    { title: 'Users', href: '/admin/users', icon: Users },
    { title: 'Credit Balances', href: '/admin/credits', icon: CreditCard },
    { title: 'Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
  ]},
  { label: 'Engagement', defaultOpen: true, items: [
    { title: 'Social Accounts', href: '/admin/social-accounts', icon: Globe },
    { title: 'Conversations', href: '/admin/conversations', icon: MessageSquare },
    { title: 'Automations', href: '/admin/automations', icon: Zap },
    { title: 'Leads', href: '/admin/leads', icon: UserCheck },
  ]},
  { label: 'AI & Bots', defaultOpen: false, items: [
    { title: 'Bots', href: '/admin/bots', icon: Bot },
    { title: 'Knowledge Sources', href: '/admin/knowledge-sources', icon: BookOpen },
    { title: 'Brand Voices', href: '/admin/brand-voices', icon: Mic },
    { title: 'Voice DNA', href: '/admin/voice-dna', icon: Brain },
    { title: 'Intelligence Logs', href: '/admin/intelligence-logs', icon: Activity },
    { title: 'Flagged Replies', href: '/admin/flagged-replies', icon: Flag },
  ]},
  { label: 'Prompts', defaultOpen: false, items: [
    { title: 'Prompt Library', href: '/admin/prompts', icon: Terminal, badge: 'NEW' },
  ]},
  { label: 'LLM Config', defaultOpen: false, items: [
    { title: 'Operation Models', href: '/admin/operation-model-configs', icon: Sliders },
    { title: 'User LLM Configs', href: '/admin/llm-configs', icon: Brain },
  ]},
  { label: 'Billing', defaultOpen: false, items: [
    { title: 'Orders', href: '/admin/orders', icon: Receipt },
    { title: 'Invoices', href: '/admin/invoices', icon: FileText },
    { title: 'Payments', href: '/admin/payments', icon: Banknote },
    { title: 'Credit Packages', href: '/admin/credit-packages', icon: Package },
    { title: 'Currencies', href: '/admin/currencies', icon: Globe },
  ]},
  { label: 'Marketing', defaultOpen: false, items: [
    { title: 'Blog', href: '/admin/blog', icon: FileText },
    { title: 'Newsletter', href: '/admin/newsletter', icon: Mail },
    { title: 'Referrals', href: '/admin/referrals', icon: Ticket },
    { title: 'Affiliates', href: '/admin/affiliates', icon: Handshake },
  ]},
  { label: 'Analytics', defaultOpen: false, items: [
    { title: 'Activity Logs', href: '/admin/activity-logs', icon: BarChart3 },
    { title: 'Media', href: '/admin/media', icon: Image },
    { title: 'Notifications', href: '/admin/notifications', icon: Bell },
  ]},
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUserStore()
  const { clearAuth } = useAuthStore(state => state.actions)
  const { toast } = useToast()

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(navGroups.map(g => [g.label, g.defaultOpen ?? false]))
  )

  const displayName = user
    ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email)
    : 'User'
  const avatarUrl = user?.avatar?.url || '/placeholder.svg'

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    clearAuth()
    router.push('/admin/login')
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-foreground tracking-tight">PostEngage</span>
            <span className="text-[10px] text-muted-foreground">.ai admin</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <SidebarSeparator className="my-1 bg-sidebar-border" />}
            <SidebarGroup className="p-0">
              <Collapsible
                open={openGroups[group.label]}
                onOpenChange={(v) => setOpenGroups(prev => ({ ...prev, [group.label]: v }))}
              >
                <CollapsibleTrigger asChild>
                  <button className="group-data-[collapsible=icon]:hidden flex w-full items-center justify-between px-2 py-1.5 hover:bg-sidebar-accent/50 rounded-md">
                    <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 p-0 h-auto">
                      {group.label}
                    </SidebarGroupLabel>
                    <ChevronRight
                      className={`h-3 w-3 text-muted-foreground/40 transition-transform duration-200 ${openGroups[group.label] ? 'rotate-90' : ''}`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item: any) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive(item.href)}
                            tooltip={item.title}
                            className="h-8 rounded-md data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-sidebar-accent"
                          >
                            <Link href={item.href} className="flex items-center gap-2">
                              <item.icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-sm flex-1 truncate">{item.title}</span>
                              {item.badge && (
                                <Badge className="text-[9px] px-1 py-0 h-3.5 bg-primary/20 text-primary border-0 font-semibold">
                                  {item.badge}
                                </Badge>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>

              {/* Icon mode — always show */}
              <div className="hidden group-data-[collapsible=icon]:block">
                <SidebarMenu>
                  {group.items.map((item: any) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild isActive={isActive(item.href)} tooltip={item.title}
                        className="h-8 rounded-md data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-sidebar-accent"
                      >
                        <Link href={item.href}><item.icon className="h-4 w-4" /></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="h-12 rounded-md data-[state=open]:bg-sidebar-accent">
                  <Avatar className="h-8 w-8 rounded-md">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="rounded-md bg-primary/10 text-primary text-xs">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium text-foreground">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-56 rounded-lg bg-popover border-border" side="top" align="end" sideOffset={4}>
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
