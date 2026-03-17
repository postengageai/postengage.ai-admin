'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { conversationsApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { StatCard } from '@/components/admin/stat-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, MessageSquare, User, Bot, Clock } from 'lucide-react'

const safeFormat = (date: string | null | undefined, withTime?: boolean) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      ...(withTime && { hour: '2-digit', minute: '2-digit' }),
    })
  } catch { return '—' }
}

export default function ConversationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const convId = params.id as string

  const [conv, setConv] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await conversationsApi.getById(convId)
        const data = (res.data as any)?.data
        if (data) setConv(data)
        else setError('Conversation not found')
      } catch (err) {
        setError('Failed to load conversation')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [convId])

  if (loading) return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>

  if (error || !conv) {
    return (
      <div>
        <AdminPageHeader title="Conversation Detail" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error || 'Not found'}</div>
      </div>
    )
  }

  const messages = conv.messages || []
  const messageCount = conv.message_count ?? messages.length ?? 0

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Conversation`}
        description={`ID: ${conv._id}`}
        action={
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/conversations')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Messages" value={messageCount} icon={MessageSquare} />
        <StatCard title="Bot Replies" value={conv.bot_reply_count ?? '—'} icon={Bot} />
        <StatCard title="Human Replies" value={conv.human_reply_count ?? '—'} icon={User} />
        <StatCard title="Duration (min)" value={conv.duration_minutes ?? '—'} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Conversation Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1"><StatusBadge status={conv.status || 'active'} /></div>
              </div>
              {conv.platform && (
                <div>
                  <Label className="text-xs text-muted-foreground">Platform</Label>
                  <div className="mt-1"><Badge variant="outline" className="capitalize">{conv.platform}</Badge></div>
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">User ID</Label>
              <p
                className="text-sm mt-1 font-mono text-primary cursor-pointer hover:underline"
                onClick={() => conv.user_id && router.push(`/admin/users/${conv.user_id}`)}
              >
                {conv.user_id || '—'}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Bot ID</Label>
              <p
                className="text-sm mt-1 font-mono text-primary cursor-pointer hover:underline"
                onClick={() => conv.bot_id && router.push(`/admin/bots/${conv.bot_id}`)}
              >
                {conv.bot_id || '—'}
              </p>
            </div>
            {conv.social_account_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Social Account ID</Label>
                <p className="text-sm mt-1 font-mono text-muted-foreground">{conv.social_account_id}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">{safeFormat(conv.created_at)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Updated</Label>
                <p className="text-sm mt-1">{safeFormat(conv.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Preview */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Messages</CardTitle></CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages available</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {messages.slice(-10).map((msg: any, i: number) => (
                  <div
                    key={msg._id || i}
                    className={`p-2 rounded-lg text-sm ${
                      msg.role === 'user' || msg.sender === 'user'
                        ? 'bg-muted/50 text-left'
                        : 'bg-primary/10 text-left'
                    }`}
                  >
                    <span className="text-xs font-medium text-muted-foreground capitalize block mb-0.5">
                      {msg.role || msg.sender || 'unknown'}
                    </span>
                    <p className="text-sm">{msg.content || msg.text || msg.message || '—'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Extra metadata */}
      {conv.metadata && Object.keys(conv.metadata).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Metadata</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(conv.metadata).map(([k, v]) => (
              <div key={k} className="flex justify-between py-1 border-b last:border-0">
                <span className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="text-sm font-medium">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
