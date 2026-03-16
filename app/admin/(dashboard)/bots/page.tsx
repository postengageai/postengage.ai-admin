'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { botsApi, AdminBot } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { StatCard } from '@/components/admin/stat-card'
import { Badge } from '@/components/ui/badge'
import { Bot } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function BotsPage() {
  const [bots, setBots] = useState<AdminBot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })

  useEffect(() => {
    const loadBots = async () => {
      try {
        setLoading(true)
        const response = await botsApi.list({ page: page + 1, limit: 10 })
        if (response.data) {
          setBots(response.data.data.data ?? [])
          const pag = response.data.data.pagination
          setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
        }
      } catch (err) {
        setError('Failed to load bots')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadBots()
  }, [page])

  const totalReplies = bots.reduce((sum, bot) => sum + (bot.stats?.total_replies || 0), 0)
  const avgConfidence = bots.length > 0
    ? (bots.reduce((sum, bot) => sum + (bot.stats?.avg_confidence || 0), 0) / bots.length).toFixed(2)
    : 0

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Bots" description="Manage AI bots" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Bots" description="Manage AI bots and their performance" />

      {loading ? (
        <div className="text-muted-foreground text-sm p-4 text-center">Loading...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Bots"
              value={pagination.total}
              icon={Bot}
            />
            <StatCard
              title="Total Replies"
              value={totalReplies.toLocaleString()}
            />
            <StatCard
              title="Avg Confidence"
              value={`${avgConfidence}%`}
            />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI Model</TableHead>
                  <TableHead>Total Replies</TableHead>
                  <TableHead>Avg Confidence</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bots.map((bot) => (
                  <TableRow key={bot._id}>
                    <TableCell className="font-medium">{bot.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={bot.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{bot.ai_model || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{bot.stats?.total_replies || 0}</TableCell>
                    <TableCell>{(bot.stats?.avg_confidence || 0).toFixed(2)}%</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(bot.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} bots</p>
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
