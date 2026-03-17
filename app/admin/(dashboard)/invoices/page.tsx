'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { invoicesApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { PaginationControls } from '@/components/admin/pagination-controls'
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

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'void', 'overdue']

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const response = await invoicesApi.list({
        page: page + 1,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })
      if (response.data) {
        setInvoices((response.data as any).data ?? response.data ?? [])
        const pag = (response.data as any).pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load invoices')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { loadInvoices() }, [loadInvoices])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setSearch(searchInput); setPage(0)
  }

  // Client-side search filter
  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase()
    return !q
      || (inv.invoice_number || '').toLowerCase().includes(q)
      || (inv.user_id || '').toLowerCase().includes(q)
      || (inv._id || '').toLowerCase().includes(q)
  })

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Invoices" description="View and manage invoices" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Invoices" description="View and manage customer invoices" />

      {loading && !invoices.length ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice # or user ID..."
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
                {INVOICE_STATUSES.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
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
                  <TableHead>Invoice #</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid At</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((invoice) => (
                    <TableRow
                      key={invoice._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/invoices/${invoice._id}`)}
                    >
                      <TableCell className="font-medium font-mono text-sm">
                        {invoice.invoice_number || invoice._id?.slice(-8) || '—'}
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-xs font-mono text-primary hover:underline cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin/users/${invoice.user_id}`) }}
                        >
                          {invoice.user_id ? invoice.user_id.slice(-8) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {invoice.amount != null ? `$${Number(invoice.amount).toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status || 'draft'} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {safeDate(invoice.due_date)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {safeDate(invoice.paid_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {safeDate(invoice.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} invoices</p>
            <PaginationControls page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
