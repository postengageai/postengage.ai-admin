'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { socialAccountsApi, AdminSocialAccount } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<AdminSocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true)
        const response = await socialAccountsApi.list({ page: page + 1, limit: 10 })
        if (response.data) {
          setAccounts(response.data.data.data ?? [])
          const pag = response.data.data.pagination
          setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
        }
      } catch (err) {
        setError('Failed to load social accounts')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadAccounts()
  }, [page])

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
        <div className="text-muted-foreground text-sm p-4 text-center">Loading...</div>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account._id}>
                    <TableCell className="font-medium">{account.username}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{account.platform}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{account.user_id}</TableCell>
                    <TableCell>
                      <Badge variant={account.is_active ? 'default' : 'secondary'}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{account.followers_count || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(account.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} accounts</p>
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
