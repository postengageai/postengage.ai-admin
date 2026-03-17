'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useParams, useRouter } from 'next/navigation'
import { botsApi, AdminBot } from '@/lib/api/admin'
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
import { ArrowLeft, Trash2, MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react'

export default function BotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.id as string

  const [bot, setBot] = useState<AdminBot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const loadBot = async () => {
      try {
        setLoading(true)
        const res = await botsApi.getById(botId)
        if (res.data) setBot(res.data as AdminBot)
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
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Replies"
          value={(bot.stats?.total_replies || 0).toLocaleString()}
          icon={MessageSquare}
        />
        <StatCard
          title="Avg Confidence"
          value={`${(bot.stats?.avg_confidence || 0).toFixed(1)}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Escalations"
          value={(bot.stats?.total_escalations || 0).toLocaleString()}
          icon={AlertTriangle}
        />
      </div>

      {/* Bot Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bot Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-sm font-medium mt-1">{bot.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <StatusBadge status={bot.status} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">AI Model</Label>
                <div className="mt-1">
                  <Badge variant="outline">{bot.ai_model || 'N/A'}</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Owner (User ID)</Label>
                <p className="text-sm mt-1 font-mono text-muted-foreground">{bot.user_id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">{format(new Date(bot.created_at), 'PPP p')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bot</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{bot.name}</strong>? This will remove the bot and all associated data permanently.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Bot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
