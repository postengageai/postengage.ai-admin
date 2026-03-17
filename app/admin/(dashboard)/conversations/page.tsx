'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { conversationsApi } from '@/lib/api/admin'
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
import { Search } from 'lucide-react'

const safeDate = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

export default function ConversationsPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true)
      const response = await conversationsApi.list({
        page: page + 1,
        limit: 20,
      })
      if (response.data) {
        setConversations(response.data.data ?? [])
        const pag = response.data.pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load conversations')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { loadConversations() }, [loadConversations])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setSearch(searchInput); setPage(0)
  }

  // Client-side filter on search and status
  const filtered = conversations.filter(c => {
    const matchStatus = statusFilter === 'all' || (c.status || 'active') === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q
      || (c._id || '').toLowerCase().includes(q)
      || (c.user_id || '').toLowerCase().includes(q)
      || (c.bot_id || '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Conversations" description="View all conversations" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Conversations" description="View all user-bot conversations" />

      {loading && !conversations.length ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID or User ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary">Search</Button>
            </form>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {(search || statusFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter('all'); setPage(0) }}>
                Clear
              </Button>
            )}
            <p className="text-xs text-muted-foreground ml-auto">Click a row to view details</p>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Bot ID</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No conversations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((conv) => (
                    <TableRow
                      key={conv._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/conversations/${conv._id}`)}
                    >
                      <TableCell className="font-mono text-xs truncate max-w-[120px]" title={conv._id}>
                        {conv._id?.slice(-8) || '—'}
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-xs font-mono text-primary hover:underline cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin/users/${conv.user_id}`) }}
                        >
                          {conv.user_id ? conv.user_id.slice(-8) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {conv.bot_id ? conv.bot_id.slice(-8) : '—'}
                      </TableCell>
                      <TableCell className="font-medium">{conv.message_count ?? conv.messages?.length ?? 0}</TableCell>
                      <TableCell>
                        <StatusBadge status={conv.status || 'active'} />
                      </TableCell>
                      <TableCell>
                        {conv.platform ? (
                          <Badge variant="outline" className="capitalize">{conv.platform}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {safeDate(conv.updated_at || conv.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} conversations</p>
            <PaginationControls page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
