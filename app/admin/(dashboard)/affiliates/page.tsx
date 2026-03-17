'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { affiliatesApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
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
import { Search } from 'lucide-react'

const safeDate = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

export default function AffiliatesPage() {
  const router = useRouter()
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadAffiliates = useCallback(async () => {
    try {
      setLoading(true)
      const response = await affiliatesApi.list({
        page: page + 1,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })
      if (response.data) {
        setAffiliates((response.data as any).data ?? response.data ?? [])
        const pag = (response.data as any).pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load affiliates')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { loadAffiliates() }, [loadAffiliates])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setSearch(searchInput); setPage(0)
  }

  const filtered = affiliates.filter(a => {
    const q = search.toLowerCase()
    return !q
      || (a.user_id || '').toLowerCase().includes(q)
      || (a.code || '').toLowerCase().includes(q)
      || (a._id || '').toLowerCase().includes(q)
  })

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Affiliates" description="Manage affiliates" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Affiliates" description="Manage affiliate partners, codes, and commissions" />

      {loading && !affiliates.length ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user ID or code..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary">Search</Button>
            </form>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            {(search || statusFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearch(''); setSearchInput(''); setStatusFilter('all'); setPage(0)
              }}>Clear</Button>
            )}
            <p className="text-xs text-muted-foreground ml-auto">Click a row to view details</p>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Referrals</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payout Method</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No affiliates found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((affiliate) => (
                    <TableRow
                      key={affiliate._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/affiliates/${affiliate._id}`)}
                    >
                      <TableCell>
                        <span
                          className="text-xs font-mono text-primary hover:underline cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin/users/${affiliate.user_id}`) }}
                        >
                          {affiliate.user_id ? affiliate.user_id.slice(-8) : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {affiliate.code ? (
                          <Badge variant="secondary" className="font-mono text-xs">{affiliate.code}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {affiliate.commission_rate != null ? `${affiliate.commission_rate}%` : '—'}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {affiliate.total_earnings != null ? `$${Number(affiliate.total_earnings).toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {affiliate.total_referrals ?? affiliate.referral_count ?? '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={affiliate.status || 'active'} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">
                        {affiliate.payout_method || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {safeDate(affiliate.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} affiliates</p>
            <PaginationControls page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
