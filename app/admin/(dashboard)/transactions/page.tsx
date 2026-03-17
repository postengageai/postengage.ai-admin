'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { creditsApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

const TX_TYPES = ['purchase', 'adjustment', 'refund', 'bonus', 'usage', 'expiry']

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await creditsApi.list({
        page: page + 1,
        limit: 20,
        ...(search && { userId: search }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
      })
      if (response.data) {
        setTransactions(response.data.data ?? [])
        const pag = response.data.pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load transactions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search, typeFilter])

  useEffect(() => { loadTransactions() }, [loadTransactions])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setSearch(searchInput); setPage(0)
  }

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Transactions" description="View credit transaction history" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="Credit Transactions"
        description="Full credit transaction history across all users"
      />

      {loading && !transactions.length ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by User ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary">Search</Button>
            </form>

            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TX_TYPES.map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(search || typeFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearch(''); setSearchInput(''); setTypeFilter('all'); setPage(0)
              }}>
                Clear
              </Button>
            )}
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx: any) => (
                    <TableRow key={tx._id}>
                      <TableCell>
                        <span className={`font-semibold text-base ${(tx.amount ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(tx.amount ?? 0) > 0 ? '+' : ''}{tx.amount ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{tx.type || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate" title={tx.reason}>
                        {tx.reason || '—'}
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-xs font-mono text-primary cursor-pointer hover:underline"
                          onClick={() => router.push(`/admin/users/${tx.user_id}`)}
                        >
                          {tx.user_id || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {safeDate(tx.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} transactions</p>
            <PaginationControls page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
