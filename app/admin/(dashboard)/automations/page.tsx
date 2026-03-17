'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { automationsApi, AdminAutomation } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { PaginationControls } from '@/components/admin/pagination-controls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Trash2 } from 'lucide-react'

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<AdminAutomation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [deleteTarget, setDeleteTarget] = useState<AdminAutomation | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadAutomations = async () => {
    try {
      setLoading(true)
      const response = await automationsApi.list({ page: page + 1, limit: 10 })
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
  }

  useEffect(() => {
    loadAutomations()
  }, [page])

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
                  <TableHead>Platform</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Triggers</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No automations found
                    </TableCell>
                  </TableRow>
                ) : (
                  automations.map((automation) => (
                    <TableRow key={automation._id}>
                      <TableCell className="font-medium">{automation.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={automation.status} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{automation.platform}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono truncate max-w-[120px]">
                        {automation.user_id}
                      </TableCell>
                      <TableCell>{automation.trigger_count || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(automation.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(automation)}
                        >
                          <Trash2 className="h-4 w-4" />
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
