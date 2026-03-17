'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useParams, useRouter } from 'next/navigation'
import { botsApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { StatCard } from '@/components/admin/stat-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ArrowLeft, Trash2, MessageSquare, TrendingUp, AlertTriangle, SkipForward } from 'lucide-react'

const safeFormat = (date: string | null | undefined, fmt: string) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return format(d, fmt)
  } catch {
    return '—'
  }
}

export default function BotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.id as string

  const [bot, setBot] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const loadBot = async () => {
      try {
        setLoading(true)
        const res = await botsApi.getById(botId)
        // Response is wrapped: res.data = { success: true, data: {...bot} }
        const botData = (res.data as any)?.data
        if (botData) setBot(botData)
        else setError('Bot not found')
      } catch (err) {
        setError('Failed to load bot')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadBot()
  }, [botId])

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await botsApi.delete(botId)
      router.push('/admin/bots')
    } catch (err) {
      console.error('Failed to delete bot', err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>
  }

  if (error || !bot) {
    return (
      <div>
        <AdminPageHeader title="Bot Detail" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">
          {error || 'Bot not found'}
        </div>
      </div>
    )
  }

  const behavior = bot.behavior || {}

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={bot.name}
        description={`Bot ID: ${bot._id}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/bots')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Replies" value={(bot.stats?.total_replies || 0).toLocaleString()} icon={MessageSquare} />
        <StatCard title="Escalations" value={(bot.stats?.total_escalations || 0).toLocaleString()} icon={AlertTriangle} />
        <StatCard title="Skipped" value={(bot.stats?.total_skipped || 0).toLocaleString()} icon={SkipForward} />
        <StatCard title="Avg Confidence" value={`${(bot.stats?.avg_confidence || 0).toFixed(1)}%`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bot Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Bot Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="text-sm font-medium mt-1">{bot.name}</p>
            </div>
            {bot.description && (
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{bot.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1"><StatusBadge status={bot.status} /></div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Active</Label>
                <div className="mt-1">
                  <Badge variant={bot.is_active ? 'default' : 'secondary'}>
                    {bot.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">AI Model</Label>
              <div className="mt-1">
                <Badge variant="outline">{bot.ai_model || 'Default'}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Owner (User ID)</Label>
              <p
                className="text-sm mt-1 font-mono text-primary cursor-pointer hover:underline"
                onClick={() => router.push(`/admin/users/${bot.user_id}`)}
              >
                {bot.user_id}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">{safeFormat(bot.created_at, 'PPP')}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Updated</Label>
                <p className="text-sm mt-1">{safeFormat(bot.updated_at, 'PPP')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Behavior Config */}
        <Card>
          <CardHeader><CardTitle className="text-base">Behavior Settings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(behavior).length === 0 ? (
              <p className="text-sm text-muted-foreground">No behavior config</p>
            ) : (
              Object.entries(behavior).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-1 border-b last:border-0">
                  <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Knowledge Sources */}
      {Array.isArray(bot.knowledge_sources) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Knowledge Sources ({bot.knowledge_sources.length})</CardTitle></CardHeader>
          <CardContent>
            {bot.knowledge_sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">No knowledge sources attached</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {bot.knowledge_sources.map((ks: any) => (
                  <Badge key={ks._id || ks} variant="outline">
                    {typeof ks === 'string' ? ks : ks.name || ks._id}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Bot</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{bot.name}</strong>? This will remove the bot and all associated data permanently.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Bot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
