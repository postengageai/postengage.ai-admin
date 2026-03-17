'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { knowledgeSourcesApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { PaginationControls } from '@/components/admin/pagination-controls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export default function KnowledgeSourcesPage() {
  const router = useRouter()
  const [sources, setSources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadSources = useCallback(async () => {
    try {
      setLoading(true)
      const response = await knowledgeSourcesApi.list({ page: page + 1, limit: 15 })
      if (response.data) {
        setSources(response.data.data ?? [])
        const pag = response.data.pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load knowledge sources')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { loadSources() }, [loadSources])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setSearch(searchInput); setPage(0)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await knowledgeSourcesApi.delete(deleteTarget._id)
      setDeleteTarget(null)
      await loadSources()
    } catch (err) {
      console.error('Failed to delete knowledge source', err)
    } finally {
      setDeleting(false)
    }
  }

  // Client-side filter
  const filtered = sources.filter(s => {
    const matchType = typeFilter === 'all' || (s.type || '') === typeFilter
    const q = search.toLowerCase()
    const matchSearch = !q
      || (s.name || '').toLowerCase().includes(q)
      || (s._id || '').toLowerCase().includes(q)
      || (s.bot_id || '').toLowerCase().includes(q)
    return matchType && matchSearch
  })

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Knowledge Sources" description="Manage knowledge bases" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Knowledge Sources" description="Manage knowledge bases and document stores" />

      {loading && !sources.length ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
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

            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
              </SelectContent>
            </Select>

            {(search || typeFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSearchInput(''); setTypeFilter('all') }}>
                Clear
              </Button>
            )}
            <p className="text-xs text-muted-foreground ml-auto">Click a row to view details</p>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Bot ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chunks</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No knowledge sources found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((source) => (
                    <TableRow
                      key={source._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/knowledge-sources/${source._id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{source.name || '—'}</p>
                          {source.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{source.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {source.type ? (
                          <Badge variant="outline" className="capitalize">{source.type}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {source.bot_id ? source.bot_id.slice(-8) : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={source.status || 'active'} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {source.chunk_count ?? source.chunks?.length ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {safeDate(source.created_at)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-7 w-7 p-0"
                          onClick={() => setDeleteTarget(source)}
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
            <p className="text-sm text-muted-foreground">Total: {pagination.total} sources</p>
            <PaginationControls page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Knowledge Source</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name || deleteTarget?._id}</strong>? This will remove all associated data permanently.
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
