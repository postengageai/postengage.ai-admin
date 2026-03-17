'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { flaggedRepliesApi } from '@/lib/api/admin'
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
import { Search, CheckCircle, XCircle } from 'lucide-react'

const safeDate = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

const FLAG_STATUSES = ['pending', 'reviewed', 'approved', 'rejected']

export default function FlaggedRepliesPage() {
  const router = useRouter()
  const [replies, setReplies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const loadReplies = useCallback(async () => {
    try {
      setLoading(true)
      const response = await flaggedRepliesApi.list({
        page: page + 1,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })
      if (response.data) {
        setReplies((response.data as any).data ?? response.data ?? [])
        const pag = (response.data as any).pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load flagged replies')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { loadReplies() }, [loadReplies])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setSearch(searchInput); setPage(0)
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setUpdating(id)
      await flaggedRepliesApi.update(id, { status })
      setReplies(prev => prev.map(r => r._id === id ? { ...r, status } : r))
    } catch (err) {
      console.error('Failed to update status', err)
    } finally {
      setUpdating(null)
    }
  }

  const filtered = replies.filter(r => {
    const q = search.toLowerCase()
    return !q
      || (r.content || '').toLowerCase().includes(q)
      || (r.reason || '').toLowerCase().includes(q)
      || (r.bot_id || '').toLowerCase().includes(q)
      || (r.user_id || '').toLowerCase().includes(q)
  })

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Flagged Replies" description="Review flagged AI replies" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Flagged Replies" description="Review and moderate flagged AI-generated replies" />

      {loading && !replies.length ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by content or reason..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary">Search</Button>
            </form>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {FLAG_STATUSES.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(search || statusFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearch(''); setSearchInput(''); setStatusFilter('all'); setPage(0)
              }}>Clear</Button>
            )}
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content Preview</TableHead>
                  <TableHead>Reason / Flag Type</TableHead>
                  <TableHead>Bot ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flagged</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No flagged replies found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((reply) => (
                    <TableRow
                      key={reply._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/flagged-replies/${reply._id}`)}
                    >
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm truncate">
                          {reply.content ? reply.content.substring(0, 100) : '—'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {reply.reason && (
                            <p className="text-sm text-muted-foreground">{reply.reason}</p>
                          )}
                          {reply.flag_type && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {reply.flag_type.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-xs font-mono text-primary hover:underline cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); if (reply.bot_id) router.push(`/admin/bots/${reply.bot_id}`) }}
                        >
                          {reply.bot_id ? reply.bot_id.slice(-8) : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={reply.status || 'pending'} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {safeDate(reply.created_at)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {(reply.status === 'pending' || reply.status === 'reviewed') && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                              disabled={updating === reply._id}
                              onClick={() => handleUpdateStatus(reply._id, 'approved')}
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              disabled={updating === reply._id}
                              onClick={() => handleUpdateStatus(reply._id, 'rejected')}
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} flagged replies</p>
            <PaginationControls page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
