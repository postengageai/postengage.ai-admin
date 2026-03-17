'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { knowledgeSourcesApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
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
import { ArrowLeft, Trash2, FileText, Link2, BookOpen } from 'lucide-react'

const safeFormat = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

export default function KnowledgeSourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sourceId = params.id as string

  const [source, setSource] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await knowledgeSourcesApi.getById(sourceId)
        const data = (res.data as any)?.data
        if (data) setSource(data)
        else setError('Knowledge source not found')
      } catch (err) {
        setError('Failed to load knowledge source')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sourceId])

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await knowledgeSourcesApi.delete(sourceId)
      router.push('/admin/knowledge-sources')
    } catch (err) {
      console.error('Failed to delete knowledge source', err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>

  if (error || !source) {
    return (
      <div>
        <AdminPageHeader title="Knowledge Source" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error || 'Not found'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={source.name || 'Knowledge Source'}
        description={`ID: ${source._id}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/knowledge-sources')}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Source Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="text-sm font-medium mt-1">{source.name || '—'}</p>
            </div>
            {source.description && (
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{source.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <div className="mt-1">
                  {source.type ? (
                    <Badge variant="outline" className="capitalize">{source.type}</Badge>
                  ) : '—'}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1"><StatusBadge status={source.status || 'active'} /></div>
              </div>
            </div>
            {source.url && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> Source URL
                </Label>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline block mt-1 truncate"
                >
                  {source.url}
                </a>
              </div>
            )}
            {(source.chunk_count !== undefined || source.chunks?.length !== undefined) && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Chunks
                </Label>
                <p className="text-sm font-medium mt-1">{source.chunk_count ?? source.chunks?.length ?? 0}</p>
              </div>
            )}
            {source.bot_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Linked Bot</Label>
                <p
                  className="text-sm mt-1 font-mono text-primary cursor-pointer hover:underline"
                  onClick={() => router.push(`/admin/bots/${source.bot_id}`)}
                >
                  {source.bot_id}
                </p>
              </div>
            )}
            {source.user_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Owner (User ID)</Label>
                <p
                  className="text-sm mt-1 font-mono text-primary cursor-pointer hover:underline"
                  onClick={() => router.push(`/admin/users/${source.user_id}`)}
                >
                  {source.user_id}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">{safeFormat(source.created_at)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Updated</Label>
                <p className="text-sm mt-1">{safeFormat(source.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content preview */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content Preview
          </CardTitle></CardHeader>
          <CardContent>
            {source.content || source.text ? (
              <pre className="text-xs bg-muted/40 p-3 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap">
                {(source.content || source.text || '').slice(0, 1000)}
                {(source.content || source.text || '').length > 1000 && '...'}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">No content preview available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Knowledge Source</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{source.name || source._id}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
