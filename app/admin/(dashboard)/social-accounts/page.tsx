'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { socialAccountsApi, AdminSocialAccount } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
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

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<AdminSocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [deleteTarget, setDeleteTarget] = useState<AdminSocialAccount | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await socialAccountsApi.list({ page: page + 1, limit: 10 })
      if (response.data) {
        setAccounts(response.data.data ?? [])
        const pag = response.data.pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load social accounts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [page])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await socialAccountsApi.delete(deleteTarget._id)
      setDeleteTarget(null)
      await loadAccounts()
    } catch (err) {
      console.error('Failed to delete social account', err)
    } finally {
      setDeleting(false)
    }
  }

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Social Accounts" description="Manage connected social media accounts" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Social Accounts" description="Manage connected social media accounts" />

      {loading ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No social accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account) => (
                    <TableRow key={account._id}>
                      <TableCell className="font-medium">{account.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{account.platform}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono truncate max-w-[120px]">
                        {account.user_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.is_active ? 'default' : 'secondary'}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{(account.followers_count || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(account.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(account)}
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
            <p className="text-sm text-muted-foreground">Total: {pagination.total} accounts</p>
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
            <DialogTitle>Remove Social Account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <strong>@{deleteTarget?.username}</strong> ({deleteTarget?.platform})? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Removing...' : 'Remove Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
