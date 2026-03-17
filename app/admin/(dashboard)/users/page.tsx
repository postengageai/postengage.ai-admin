'use client'
import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { usersApi, AdminUser } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { StatCard } from '@/components/admin/stat-card'
import { PaginationControls } from '@/components/admin/pagination-controls'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Users, UserCheck, ShieldCheck } from 'lucide-react'

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await usersApi.list({
        page: page + 1,
        limit: 10,
        ...(search ? { search } : {}),
      })
      if (response.data) {
        setUsers(response.data.data ?? [])
        const pag = response.data.pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load users')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    setSearch(searchInput)
  }

  const verifiedCount = users.filter((u) => u.is_verified).length
  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'superadmin').length

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Users" description="Manage system users" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Users" description="Manage system users and their roles" />

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Users" value={pagination.total} icon={Users} />
          <StatCard title="Verified (page)" value={verifiedCount} icon={UserCheck} />
          <StatCard title="Admins (page)" value={adminCount} icon={ShieldCheck} />
        </div>
      )}

      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
          <Input
            placeholder="Search by email or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(0) }}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
            >
              Clear
            </button>
          )}
        </form>

        {loading ? (
          <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
        ) : (
          <>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow
                        key={user._id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/admin/users/${user._id}`)}
                      >
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          {user.first_name || user.last_name
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' || user.role === 'superadmin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={user.status} />
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_verified ? 'default' : 'secondary'}>
                            {user.is_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total: {pagination.total} users</p>
              <PaginationControls
                page={page}
                totalPages={pagination.total_pages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
