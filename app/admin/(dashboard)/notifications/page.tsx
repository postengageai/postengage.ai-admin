'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { notificationsApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Send } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true)
        const response = await notificationsApi.list({ page: page + 1, limit: 10 })
        if (response.data) {
          setNotifications(response.data.data.data ?? [])
          const pag = response.data.data.pagination
          setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
        }
      } catch (err) {
        setError('Failed to load notifications')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [page])

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Notifications" description="Manage notifications" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="Notifications"
        description="View and send notifications to users"
        action={
          <Button className="gap-2">
            <Send className="h-4 w-4" />
            Send Notification
          </Button>
        }
      />

      {loading ? (
        <div className="text-muted-foreground text-sm p-4 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Read</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notif) => (
                  <TableRow key={notif._id || notif.id}>
                    <TableCell className="font-medium">{notif.title || '-'}</TableCell>
                    <TableCell className="truncate max-w-xs text-sm">{notif.message || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{notif.type || 'info'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{notif.user_id || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={notif.read ? 'secondary' : 'outline'}>
                        {notif.read ? 'Read' : 'Unread'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {notif.created_at ? format(new Date(notif.created_at), 'MMM d, yyyy') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} notifications</p>
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
