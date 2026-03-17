'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { voiceDnaApi } from '@/lib/api/admin'
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
import { ArrowLeft, Trash2, Brain } from 'lucide-react'

const safeFormat = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

export default function VoiceDnaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dnaId = params.id as string

  const [dna, setDna] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await voiceDnaApi.getById(dnaId)
        const data = (res.data as any)?.data
        if (data) setDna(data)
        else setError('Voice DNA not found')
      } catch (err) {
        setError('Failed to load voice DNA')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dnaId])

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await voiceDnaApi.delete(dnaId)
      router.push('/admin/voice-dna')
    } catch (err) {
      console.error('Failed to delete voice DNA', err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>

  if (error || !dna) {
    return (
      <div>
        <AdminPageHeader title="Voice DNA" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error || 'Not found'}</div>
      </div>
    )
  }

  const samplePosts = Array.isArray(dna.sample_posts) ? dna.sample_posts
    : Array.isArray(dna.samples) ? dna.samples
    : Array.isArray(dna.examples) ? dna.examples
    : []

  const traits = dna.personality_traits ?? dna.traits ?? []
  const keywords = dna.keywords ?? dna.vocabulary ?? []
  const avoidWords = dna.avoid_words ?? dna.words_to_avoid ?? []

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={dna.name || 'Voice DNA'}
        description={`ID: ${dna._id}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/voice-dna')}>
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
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="text-sm font-medium mt-1">{dna.name || '—'}</p>
            </div>
            {dna.description && (
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{dna.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1"><StatusBadge status={dna.status || 'active'} /></div>
              </div>
              {dna.tone && (
                <div>
                  <Label className="text-xs text-muted-foreground">Tone</Label>
                  <div className="mt-1"><Badge variant="outline" className="capitalize">{dna.tone}</Badge></div>
                </div>
              )}
            </div>
            {dna.writing_style && (
              <div>
                <Label className="text-xs text-muted-foreground">Writing Style</Label>
                <p className="text-sm mt-1 capitalize">{dna.writing_style}</p>
              </div>
            )}
            {dna.user_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Owner (User ID)</Label>
                <p
                  className="text-sm mt-1 font-mono text-primary cursor-pointer hover:underline"
                  onClick={() => router.push(`/admin/users/${dna.user_id}`)}
                >
                  {dna.user_id}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">{safeFormat(dna.created_at)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Updated</Label>
                <p className="text-sm mt-1">{safeFormat(dna.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DNA Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">DNA Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {traits.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Personality Traits</Label>
                <div className="flex flex-wrap gap-1">
                  {traits.map((trait: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs capitalize">{trait}</Badge>
                  ))}
                </div>
              </div>
            )}
            {keywords.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Keywords / Vocabulary</Label>
                <div className="flex flex-wrap gap-1">
                  {keywords.map((kw: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
            {avoidWords.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Words to Avoid</Label>
                <div className="flex flex-wrap gap-1">
                  {avoidWords.map((w: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs text-destructive">{w}</Badge>
                  ))}
                </div>
              </div>
            )}
            {dna.engagement_style && (
              <div>
                <Label className="text-xs text-muted-foreground">Engagement Style</Label>
                <p className="text-sm mt-1 capitalize">{dna.engagement_style}</p>
              </div>
            )}
            {traits.length === 0 && keywords.length === 0 && avoidWords.length === 0 && (
              <p className="text-sm text-muted-foreground">No configuration data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sample Posts */}
      {samplePosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sample Posts / Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {samplePosts.map((post: string, i: number) => (
                <div key={i} className="bg-muted/40 p-3 rounded-lg text-sm">
                  {post}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Voice DNA</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{dna.name}</strong>? This cannot be undone.
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
