'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { intelligenceLogsApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

const LOG_TYPES = ['intent_classification', 'response_generation', 'voice_dna_analysis', 'few_shot_curation', 'entity_extraction', 'bot_simulation', 'content_moderation', 'query', 'response', 'error', 'performance']

export default function IntelligenceLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      const response = await intelligenceLogsApi.list({
        page: page + 1,
        limit: 25,
        ...(typeFilter !== 'all' && { type: typeFilter }),
      })
      if (response.data) {
        setLogs((response.data as any).data ?? response.data ?? [])
        const pag = (response.data as any).pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load intelligence logs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter])

  useEffect(() => { loadLogs() }, [loadLogs])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setSearch(searchInput); setPage(0)
  }

  const filtered = logs.filter(log => {
    const q = search.toLowerCase()
    return !q
      || (log.bot_id || '').toLowerCase().includes(q)
      || (log.user_id || '').toLowerCase().includes(q)
      || (log._id || '').toLowerCase().includes(q)
      || (log.model || '').toLowerCase().includes(q)
  })

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Intelligence Logs" description="View AI intelligence logs" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Intelligence Logs" description="Monitor AI intelligence logs and performance metrics" />

      {loading && !logs.length ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by bot ID or user ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary">Search</Button>
            </form>

            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0) }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {LOG_TYPES.map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(search || typeFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearch(''); setSearchInput(''); setTypeFilter('all'); setPage(0)
              }}>Clear</Button>
            )}
            <p className="text-xs text-muted-foreground ml-auto">Click a row to view details</p>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Bot ID</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((log) => (
                    <TableRow
                      key={log._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/intelligence-logs/${log._id}`)}
                    >
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {(log.type || '—').replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-xs font-mono text-primary hover:underline cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); if (log.bot_id) router.push(`/admin/bots/${log.bot_id}`) }}
                        >
                          {log.bot_id ? log.bot_id.slice(-8) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.model || '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.latency != null ? (
                          <span className={log.latency > 3000 ? 'text-amber-600' : 'text-green-600'}>
                            {log.latency}ms
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {(log.tokens ?? ((log.input_tokens ?? 0) + (log.output_tokens ?? 0))) || '—'}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {log.cost != null ? `$${Number(log.cost).toFixed(4)}` : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {safeDate(log.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} logs</p>
            <PaginationControls page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
