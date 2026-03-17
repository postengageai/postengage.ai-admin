'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { flaggedRepliesApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Flag, CheckCircle, XCircle, Eye } from 'lucide-react'

const safeFormat = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export default function FlaggedReplyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const replyId = params.id as string

  const [reply, setReply] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await flaggedRepliesApi.getById(replyId)
        const data = (res.data as any)?.data
        if (data) setReply(data)
        else setError('Flagged reply not found')
      } catch (err) {
        setError('Failed to load flagged reply')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [replyId])

  const handleUpdateStatus = async (status: string) => {
    try {
      setUpdating(true)
      await flaggedRepliesApi.update(replyId, { status })
      setReply((prev: any) => ({ ...prev, status }))
    } catch (err) {
      console.error('Failed to update status', err)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>

  if (error || !reply) {
    return (
      <div>
        <AdminPageHeader title="Flagged Reply" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error || 'Not found'}</div>
      </div>
    )
  }

  const isPending = reply.status === 'pending' || reply.status === 'reviewed'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Flagged Reply"
        description={`ID: ${reply._id}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/flagged-replies')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('approved')}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('rejected')}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {reply.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                disabled={updating}
                onClick={() => handleUpdateStatus('reviewed')}
              >
                <Eye className="h-4 w-4 mr-1" />
                Mark Reviewed
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Flag Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Flag Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1"><StatusBadge status={reply.status || 'pending'} /></div>
              </div>
              {reply.flag_type && (
                <div>
                  <Label className="text-xs text-muted-foreground">Flag Type</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="capitalize text-xs">
                      {reply.flag_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            {reply.reason && (
              <div>
                <Label className="text-xs text-muted-foreground">Reason</Label>
                <p className="text-sm mt-1">{reply.reason}</p>
              </div>
            )}
            {reply.bot_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Bot</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/bots/${reply.bot_id}`)}
                >
                  {reply.bot_id}
                </p>
              </div>
            )}
            {reply.user_id && (
              <div>
                <Label className="text-xs text-muted-foreground">User</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/users/${reply.user_id}`)}
                >
                  {reply.user_id}
                </p>
              </div>
            )}
            {reply.conversation_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Conversation</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/conversations/${reply.conversation_id}`)}
                >
                  {reply.conversation_id}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Flagged</Label>
                <p className="text-sm mt-1">{safeFormat(reply.created_at)}</p>
              </div>
              {reply.reviewed_at && (
                <div>
                  <Label className="text-xs text-muted-foreground">Reviewed</Label>
                  <p className="text-sm mt-1">{safeFormat(reply.reviewed_at)}</p>
                </div>
              )}
            </div>
            {reply.reviewed_by && (
              <div>
                <Label className="text-xs text-muted-foreground">Reviewed By</Label>
                <p className="text-sm font-mono mt-1">{reply.reviewed_by}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Original Message Context */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Original Message Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reply.original_message && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Incoming Message</Label>
                <div className="bg-muted/40 p-3 rounded-lg text-sm">
                  {reply.original_message}
                </div>
              </div>
            )}
            {reply.platform && (
              <div>
                <Label className="text-xs text-muted-foreground">Platform</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className="capitalize">{reply.platform}</Badge>
                </div>
              </div>
            )}
            {reply.score != null && (
              <div>
                <Label className="text-xs text-muted-foreground">Confidence Score</Label>
                <p className="text-sm font-medium mt-1">{reply.score}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Flagged Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Flagged Reply Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm whitespace-pre-wrap">
              {reply.content || '—'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
