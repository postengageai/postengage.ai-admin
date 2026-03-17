'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { voiceDnaApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { PaginationControls } from '@/components/admin/pagination-controls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Search, Trash2 } from 'lucide-react'

const safeDate = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

export default function VoiceDnaPage() {
  const router = useRouter()
  const [dnas, setDnas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadDnas = useCallback(async () => {
    try {
      setLoading(true)
      const response = await voiceDnaApi.list({ page: page + 1, limit: 15 })
      if (response.data) {
        setDnas((response.data as any).data ?? response.data ?? [])
        const pag = (response.data as any).pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load voice DNA profiles')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { loadDnas() }, [loadDnas])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setSearch(searchInput)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await voiceDnaApi.delete(deleteTarget._id)
      setDeleteTarget(null)
      await loadDnas()
    } catch (err) {
      console.error('Failed to delete voice DNA', err)
    } finally {
      setDeleting(false)
    }
  }

  const filtered = dnas.filter(d => {
    const q = search.toLowerCase()
    return !q
      || (d.name || '').toLowerCase().includes(q)
      || (d.user_id || '').toLowerCase().includes(q)
      || (d._id || '').toLowerCase().includes(q)
  })

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Voice DNA" description="Manage voice DNA profiles" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Voice DNA" description="Manage voice DNA profiles and characteristics" />

      {loading && !dnas.length ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or user ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary">Search</Button>
            </form>
            {search && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSearchInput('') }}>Clear</Button>
            )}
            <p className="text-xs text-muted-foreground ml-auto">Click a row to view details</p>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tone</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sample Posts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No voice DNA profiles found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((dna) => (
                    <TableRow
                      key={dna._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/voice-dna/${dna._id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{dna.name || '—'}</p>
                          {dna.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[160px]">{dna.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {dna.tone ? (
                          <Badge variant="outline" className="capitalize">{dna.tone}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-xs font-mono text-primary cursor-pointer hover:underline"
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin/users/${dna.user_id}`) }}
                        >
                          {dna.user_id ? dna.user_id.slice(-8) : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={dna.status || 'active'} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {Array.isArray(dna.sample_posts) ? dna.sample_posts.length : (Array.isArray(dna.samples) ? dna.samples.length : '—')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {safeDate(dna.created_at)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-7 w-7 p-0"
                          onClick={() => setDeleteTarget(dna)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} voice DNA profiles</p>
            <PaginationControls page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Voice DNA</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name || 'this profile'}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
