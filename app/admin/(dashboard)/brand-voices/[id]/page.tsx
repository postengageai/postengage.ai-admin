'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { brandVoicesApi } from '@/lib/api/admin'
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
import { ArrowLeft, Trash2, Mic } from 'lucide-react'

const safeFormat = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

export default function BrandVoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const voiceId = params.id as string

  const [voice, setVoice] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await brandVoicesApi.getById(voiceId)
        const data = (res.data as any)?.data
        if (data) setVoice(data)
        else setError('Brand voice not found')
      } catch (err) {
        setError('Failed to load brand voice')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [voiceId])

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await brandVoicesApi.delete(voiceId)
      router.push('/admin/brand-voices')
    } catch (err) {
      console.error('Failed to delete brand voice', err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>

  if (error || !voice) {
    return (
      <div>
        <AdminPageHeader title="Brand Voice" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error || 'Not found'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={voice.name || 'Brand Voice'}
        description={`ID: ${voice._id}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/brand-voices')}>
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
          <CardHeader><CardTitle className="text-base flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Voice Information
          </CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="text-sm font-medium mt-1">{voice.name || '—'}</p>
            </div>
            {voice.description && (
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{voice.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1"><StatusBadge status={voice.status || 'active'} /></div>
              </div>
              {voice.tone && (
                <div>
                  <Label className="text-xs text-muted-foreground">Tone</Label>
                  <div className="mt-1"><Badge variant="outline" className="capitalize">{voice.tone}</Badge></div>
                </div>
              )}
            </div>
            {voice.language && (
              <div>
                <Label className="text-xs text-muted-foreground">Language</Label>
                <p className="text-sm mt-1">{voice.language}</p>
              </div>
            )}
            {voice.user_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Owner (User ID)</Label>
                <p
                  className="text-sm mt-1 font-mono text-primary cursor-pointer hover:underline"
                  onClick={() => router.push(`/admin/users/${voice.user_id}`)}
                >
                  {voice.user_id}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">{safeFormat(voice.created_at)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Updated</Label>
                <p className="text-sm mt-1">{safeFormat(voice.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Configuration */}
        <Card>
          <CardHeader><CardTitle className="text-base">Voice Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {/* Sample / Examples */}
            {(voice.examples || voice.sample_text || voice.samples) ? (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Sample Text / Examples</Label>
                <div className="space-y-2">
                  {(Array.isArray(voice.examples || voice.samples) ? (voice.examples || voice.samples) : [voice.sample_text]).map((example: string, i: number) => (
                    <div key={i} className="bg-muted/40 p-2 rounded text-sm">
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Keywords */}
            {voice.keywords && voice.keywords.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Keywords</Label>
                <div className="flex flex-wrap gap-1">
                  {voice.keywords.map((kw: string) => (
                    <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Avoid words */}
            {voice.avoid_words && voice.avoid_words.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Words to Avoid</Label>
                <div className="flex flex-wrap gap-1">
                  {voice.avoid_words.map((w: string) => (
                    <Badge key={w} variant="outline" className="text-xs text-destructive">{w}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Config object */}
            {voice.config && Object.keys(voice.config).length > 0 && (
              Object.entries(voice.config).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))
            )}

            {!voice.examples && !voice.sample_text && !voice.keywords && !voice.config && (
              <p className="text-sm text-muted-foreground">No additional configuration</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Brand Voice</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{voice.name}</strong>? This cannot be undone.
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
