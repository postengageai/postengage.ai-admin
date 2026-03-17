'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { botsApi, AdminBot } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { StatCard } from '@/components/admin/stat-card'
import { PaginationControls } from '@/components/admin/pagination-controls'
import { Badge } from '@/components/ui/badge'
import { Bot, MessageSquare, Zap } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function BotsPage() {
  const router = useRouter()
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
          setBots(response.data.data ?? [])
          const pag = response.data.pagination
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
    ? (bots.reduce((sum, bot) => sum + (bot.stats?.avg_confidence || 0), 0) / bots.length).toFixed(1)
    : '0'

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

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Bots" value={pagination.total} icon={Bot} />
          <StatCard title="Total Replies (page)" value={totalReplies.toLocaleString()} icon={MessageSquare} />
          <StatCard title="Avg Confidence (page)" value={`${avgConfidence}%`} icon={Zap} />
        </div>
      )}

      {loading ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI Model</TableHead>
                  <TableHead>Total Replies</TableHead>
                  <TableHead>Escalations</TableHead>
                  <TableHead>Avg Confidence</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No bots found
                    </TableCell>
                  </TableRow>
                ) : (
                  bots.map((bot) => (
                    <TableRow
                      key={bot._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/bots/${bot._id}`)}
                    >
                      <TableCell className="font-medium">{bot.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={bot.status} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{bot.ai_model || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>{(bot.stats?.total_replies || 0).toLocaleString()}</TableCell>
                      <TableCell>{(bot.stats?.total_escalations || 0).toLocaleString()}</TableCell>
                      <TableCell>{(bot.stats?.avg_confidence || 0).toFixed(1)}%</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(bot.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} bots</p>
            <PaginationControls
              page={page}
              totalPages={pagination.total_pages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
