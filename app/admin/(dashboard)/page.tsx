'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MessageSquare,
  Users,
  Zap,
  Bot,
  ShoppingCart,
  FileText,
  Ticket,
  ChevronRight,
  Plus,
  Instagram,
  Activity,
} from 'lucide-react'
import { overviewApi, socialAccountsApi, activityLogsApi, AdminSocialAccount } from '@/lib/api/admin'
import { format } from 'date-fns'
import Link from 'next/link'

interface OverviewData {
  users: { total: number; active: number; new_today: number }
  automations: { total: number }
  leads: { total: number }
  orders: { total: number }
  affiliates: { total: number }
  newsletter_subscribers: { total: number }
  waitlist: { total: number }
  bots: { total: number }
  conversations: { total: number }
  sessions: { total: number }
}

interface ActivityLog {
  _id: string
  action: string
  user_id?: string
  entity_type?: string
  description?: string
  created_at: string
}

const serviceStatuses = [
  { name: 'API Server' },
  { name: 'Database' },
  { name: 'Cache (Redis)' },
  { name: 'Queue Worker' },
  { name: 'Storage (MinIO)' },
]

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [socialAccounts, setSocialAccounts] = useState<AdminSocialAccount[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, socialRes, activityRes] = await Promise.all([
          overviewApi.get(),
          socialAccountsApi.list({ limit: 5, page: 1 }),
          activityLogsApi.list({ limit: 8, page: 1 }),
        ])
        if (overviewRes.data) setOverview(overviewRes.data.data as OverviewData)
        if (socialRes.data) setSocialAccounts((socialRes.data.data as AdminSocialAccount[]) ?? [])
        if (activityRes.data) setActivityLogs((activityRes.data.data as ActivityLog[]) ?? [])
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const kpis = overview
    ? [
        {
          label: 'Total Users',
          value: overview.users.total.toLocaleString(),
          sub: `${overview.users.active} active · ${overview.users.new_today} new today`,
          icon: Users,
        },
        {
          label: 'Conversations',
          value: overview.conversations.total.toLocaleString(),
          sub: 'All time',
          icon: MessageSquare,
        },
        {
          label: 'Automations',
          value: overview.automations.total.toLocaleString(),
          sub: 'Across all bots',
          icon: Zap,
        },
        {
          label: 'Leads Captured',
          value: overview.leads.total.toLocaleString(),
          sub: `${overview.orders.total} orders`,
          icon: ShoppingCart,
        },
        {
          label: 'AI Bots',
          value: overview.bots.total.toLocaleString(),
          sub: 'Active bots',
          icon: Bot,
        },
        {
          label: 'Waitlist',
          value: overview.waitlist.total.toLocaleString(),
          sub: `${overview.newsletter_subscribers.total} newsletter subscribers`,
          icon: Activity,
        },
      ]
    : []

  return (
    <div className="p-6 space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/blog">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <FileText className="mr-2 h-4 w-4" />
            Manage Blog
          </Button>
        </Link>
        <Link href="/admin/referrals">
          <Button variant="outline" className="border-border text-foreground hover:bg-secondary bg-transparent">
            <Ticket className="mr-2 h-4 w-4" />
            Manage Referrals
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="p-5 h-24" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <Card key={kpi.label} className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-2xl font-semibold text-foreground">{kpi.value}</div>
                      <p className="text-xs font-medium text-foreground/80 mt-0.5">{kpi.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.sub}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Connected Accounts + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Connected Social Accounts */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-foreground">Connected Accounts</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" asChild>
                <Link href="/admin/social-accounts">
                  View all <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-secondary/30 animate-pulse" />
              ))
            ) : socialAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No social accounts connected yet.</p>
            ) : (
              socialAccounts.map((account) => (
                <div key={account._id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 shrink-0">
                    <Instagram className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">@{account.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">{account.platform}</p>
                  </div>
                  <Badge
                    variant={account.is_active ? 'default' : 'secondary'}
                    className={account.is_active ? 'bg-success/10 text-success border-success/20 text-xs' : 'text-xs'}
                  >
                    {account.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))
            )}
            <Button variant="outline" className="w-full h-9 text-xs border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-secondary bg-transparent" asChild>
              <Link href="/admin/social-accounts">
                <Plus className="mr-2 h-3 w-3" />
                View all social accounts
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-foreground">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" asChild>
                <Link href="/admin/activity-logs">
                  View all <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-secondary/30 animate-pulse" />
                ))}
              </div>
            ) : activityLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recent activity.</p>
            ) : (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log._id} className="flex gap-3 items-start">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary mt-0.5">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-tight">
                        {log.description ?? log.action ?? 'Activity recorded'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(log.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-foreground">System Status</CardTitle>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-success">All systems operational</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {serviceStatuses.map((service) => (
              <div key={service.name} className="flex items-center gap-2.5 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                <span className="text-sm text-foreground truncate">{service.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
