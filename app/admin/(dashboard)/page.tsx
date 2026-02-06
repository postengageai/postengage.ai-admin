'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowUpRight, 
  ArrowDownRight,
  MessageSquare,
  Users,
  Zap,
  TrendingUp,
  Instagram,
  Bot,
  Activity,
  Plus,
  ChevronRight,
  FileText,
  Ticket,
} from 'lucide-react'
import { recentActivity, serviceStatuses, engagementData } from '@/lib/data'
import { 
  Area, 
  AreaChart,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
} from 'recharts'
import Link from 'next/link'

// PostEngage.ai specific KPIs
const engagementKPIs = [
  {
    label: 'Conversations Started',
    value: '2,847',
    change: 23.5,
    changeType: 'increase' as const,
    period: 'vs last week',
    icon: MessageSquare,
  },
  {
    label: 'Leads Captured',
    value: '486',
    change: 18.2,
    changeType: 'increase' as const,
    period: 'vs last week',
    icon: Users,
  },
  {
    label: 'Automations Triggered',
    value: '12.4K',
    change: 31.8,
    changeType: 'increase' as const,
    period: 'vs last week',
    icon: Zap,
  },
  {
    label: 'Response Rate',
    value: '94.2%',
    change: 2.1,
    changeType: 'increase' as const,
    period: 'vs last week',
    icon: TrendingUp,
  },
]

// Connected accounts
const connectedAccounts = [
  { name: '@brand_official', followers: '125K', status: 'active', automations: 8 },
  { name: '@lifestyle_co', followers: '89K', status: 'active', automations: 5 },
  { name: '@tech_startup', followers: '45K', status: 'paused', automations: 3 },
]

function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export default function DashboardPage() {
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {engagementKPIs.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {kpi.changeType === 'increase' ? (
                      <ArrowUpRight className="h-3 w-3 text-success" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-destructive" />
                    )}
                    <span className={kpi.changeType === 'increase' ? 'text-success' : 'text-destructive'}>
                      {kpi.change > 0 ? '+' : ''}{kpi.change}%
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-semibold text-foreground">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Engagement Chart */}
        <Card className="lg:col-span-3 bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-foreground">Engagement Overview</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">7D</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs bg-secondary text-foreground">30D</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">90D</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementData}>
                  <defs>
                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} 
                    tickLine={false}
                    axisLine={false}
                    width={35}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
                            <p className="text-xs text-muted-foreground mb-1">{label}</p>
                            <p className="text-sm font-medium text-foreground">
                              {payload[0].value} conversations
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="conversations"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#colorEngagement)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-foreground">Connected Accounts</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" asChild>
                <Link href="/admin/users">
                  View all
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectedAccounts.map((account) => (
              <div
                key={account.name}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500">
                  <Instagram className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{account.followers} followers</p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={account.status === 'active' ? 'default' : 'secondary'}
                    className={account.status === 'active' ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}
                  >
                    {account.status}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">{account.automations} automations</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full h-9 text-xs border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-secondary bg-transparent">
              <Plus className="mr-2 h-3 w-3" />
              Connect new account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-foreground">Recent Activity</CardTitle>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-[10px]">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    {activity.type === 'user_signup' ? (
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : activity.type === 'payment' ? (
                      <Zap className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-tight truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
            <div className="space-y-2">
              {serviceStatuses.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        service.status === 'operational'
                          ? 'bg-success'
                          : service.status === 'degraded'
                            ? 'bg-warning'
                            : 'bg-destructive'
                      }`}
                    />
                    <span className="text-sm text-foreground">{service.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {service.latency ? `${service.latency}ms` : 'Healthy'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Banner */}
    </div>
  )
}
