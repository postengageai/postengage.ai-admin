'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { intelligenceLogsApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
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

const typeOptions = [
  { value: 'query', label: 'Query' },
  { value: 'response', label: 'Response' },
  { value: 'error', label: 'Error' },
  { value: 'performance', label: 'Performance' },
]

export default function IntelligenceLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true)
        const response = await intelligenceLogsApi.list({
          page: page + 1,
          limit: 10,
          ...(typeFilter && typeFilter !== 'all' && { type: typeFilter }),
        })
        if (response.data) {
          setLogs(response.data.data.data ?? [])
          const pag = response.data.data.pagination
          setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
        }
      } catch (err) {
        setError('Failed to load intelligence logs')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [page, typeFilter])

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
      <AdminPageHeader title="Intelligence Logs" description="Monitor AI intelligence logs and performance" />

      {loading ? (
        <div className="text-muted-foreground text-sm p-4 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Bot</TableHead>
                  <TableHead>Latency (ms)</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id || log.id}>
                    <TableCell className="font-medium">{log.type || '-'}</TableCell>
                    <TableCell className="text-sm">{log.bot_id || '-'}</TableCell>
                    <TableCell>{log.latency || 0}</TableCell>
                    <TableCell>{log.tokens || 0}</TableCell>
                    <TableCell>${(log.cost || 0).toFixed(4)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.created_at ? format(new Date(log.created_at), 'MMM d, yyyy HH:mm') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} logs</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground px-3 py-1">
                Page {page + 1} of {pagination.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.total_pages - 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
