'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { automationsApi, AdminAutomation } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { StatCard } from '@/components/admin/stat-card'
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
import { Zap, CheckCircle2, XCircle, Search, Trash2 } from 'lucide-react'

const safeFormat = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

export default function AutomationsPage() {
  const router = useRouter()
  const [automations, setAutomations] = useState<AdminAutomation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [deleteTarget, setDeleteTarget] = useState<AdminAutomation | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')

  const loadAutomations = useCallback(async () => {
    try {
      setLoading(true)
      const response = await automationsApi.list({
        page: page + 1,
        limit: 10,
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(platformFilter !== 'all' && { platform: platformFilter }),
      })
      if (response.data) {
        setAutomations(response.data.data ?? [])
        const pag = response.data.pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load automations')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, platformFilter])

  useEffect(() => {
    loadAutomations()
  }, [loadAutomations])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await automationsApi.delete(deleteTarget._id)
      setDeleteTarget(null)
      await loadAutomations()
    } catch (err) {
      console.error('Failed to delete automation', err)
    } finally {
      setDeleting(false)
    }
  }

  // Page-level aggregate stats
  const totalExecutions = automations.reduce((sum, a) => sum + (a.execution_count || a.trigger_count || 0), 0)
  const totalSuccess = automations.reduce((sum, a) => sum + (a.success_count || 0), 0)
  const totalFailures = automations.reduce((sum, a) => sum + (a.failure_count || 0), 0)

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Automations" description="Manage user automations" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Automations" description="Manage user automations and workflows" />

      {!loading && automations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Executions (page)" value={totalExecutions.toLocaleString()} icon={Zap} />
          <StatCard title="Successful (page)" value={totalSuccess.toLocaleString()} icon={CheckCircle2} />
          <StatCard title="Failed (page)" value={totalFailures.toLocaleString()} icon={XCircle} />
        </div>
      )}

      {loading && !automations.length ? (
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

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0) }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>

            <Select value={platformFilter} onValueChange={(v) => { setPlatformFilter(v); setPage(0) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>

            {(search || statusFilter !== 'all' || platformFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearch(''); setSearchInput(''); setStatusFilter('all'); setPlatformFilter('all'); setPage(0)
              }}>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Executions</TableHead>
                  <TableHead>Success</TableHead>
                  <TableHead>Failures</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No automations found
                    </TableCell>
                  </TableRow>
                ) : (
                  automations.map((automation) => (
                    <TableRow
                      key={automation._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/automations/${automation._id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{automation.name}</p>
                          {automation.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {automation.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={automation.status} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{automation.platform || '—'}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {(automation.execution_count ?? automation.trigger_count ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {(automation.success_count || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {(automation.failure_count || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {safeFormat(automation.last_run_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {safeFormat(automation.created_at)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-7 w-7 p-0"
                          onClick={() => setDeleteTarget(automation)}
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
            <p className="text-sm text-muted-foreground">Total: {pagination.total} automations</p>
            <PaginationControls
              page={page}
              totalPages={pagination.total_pages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Automation</DialogTitle>
          </DialogHeader>
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
