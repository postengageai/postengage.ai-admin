'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { brandVoicesApi } from '@/lib/api/admin'
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

export default function BrandVoicesPage() {
  const router = useRouter()
  const [voices, setVoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadVoices = useCallback(async () => {
    try {
      setLoading(true)
      const response = await brandVoicesApi.list({ page: page + 1, limit: 15 })
      if (response.data) {
        setVoices(response.data.data ?? [])
        const pag = response.data.pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load brand voices')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { loadVoices() }, [loadVoices])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setSearch(searchInput)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await brandVoicesApi.delete(deleteTarget._id)
      setDeleteTarget(null)
      await loadVoices()
    } catch (err) {
      console.error('Failed to delete brand voice', err)
    } finally {
      setDeleting(false)
    }
  }

  const filtered = voices.filter(v => {
    const q = search.toLowerCase()
    return !q || (v.name || '').toLowerCase().includes(q) || (v.user_id || '').toLowerCase().includes(q)
  })

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Brand Voices" description="Manage brand voice templates" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Brand Voices" description="Manage brand voice templates and styles" />

      {loading && !voices.length ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
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
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No brand voices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((voice) => (
                    <TableRow
                      key={voice._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/brand-voices/${voice._id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{voice.name || '—'}</p>
                          {voice.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{voice.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {voice.tone ? (
                          <Badge variant="outline" className="capitalize">{voice.tone}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-xs font-mono text-primary cursor-pointer hover:underline"
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin/users/${voice.user_id}`) }}
                        >
                          {voice.user_id ? voice.user_id.slice(-8) : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={voice.status || 'active'} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {safeDate(voice.created_at)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-7 w-7 p-0"
                          onClick={() => setDeleteTarget(voice)}
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
            <p className="text-sm text-muted-foreground">Total: {pagination.total} voices</p>
            <PaginationControls page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Brand Voice</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
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
