'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { creditsApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function CreditsPage() {
  const [credits, setCredits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })

  useEffect(() => {
    const loadCredits = async () => {
      try {
        setLoading(true)
        const response = await creditsApi.list({ page: page + 1, limit: 10 })
        if (response.data) {
          setCredits(response.data.data ?? [])
          const pag = response.data.pagination
          setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
        }
      } catch (err) {
        setError('Failed to load credits')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadCredits()
  }, [page])

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Credits" description="View credit balance and transactions" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Credits" description="View credit balance and transactions" />

      {loading ? (
        <div className="text-muted-foreground text-sm p-4 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Total Used</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.map((credit) => (
                  <TableRow key={credit._id || credit.id}>
                    <TableCell className="font-medium">{credit.user_id || '-'}</TableCell>
                    <TableCell>{credit.balance || 0}</TableCell>
                    <TableCell>{credit.total_used || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {credit.updated_at ? format(new Date(credit.updated_at), 'MMM d, yyyy') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} records</p>
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
