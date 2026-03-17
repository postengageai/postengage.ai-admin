'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { leadsApi, AdminLead } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { PaginationControls } from '@/components/admin/pagination-controls'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
]

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

// Get display name from lead object — handles both old and new field names
const getLeadName = (lead: AdminLead) =>
  lead.full_name || lead.name || lead.email || '—'

// Get source/platform from lead — handles both old and new field names
const getLeadSource = (lead: AdminLead) => {
  if (lead.captured_from) return lead.captured_from
  if (lead.source) return lead.source
  if (lead.social_profiles?.[0]?.platform) return lead.social_profiles[0].platform
  return '—'
}

// Get primary social handle
const getLeadHandle = (lead: AdminLead) => {
  const sp = lead.social_profiles?.[0]
  if (!sp) return null
  return sp.username ? `@${sp.username}` : sp.url || null
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<AdminLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true)
      const response = await leadsApi.list({
        page: page + 1,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(search && { search }),
      })
      if (response.data) {
        setLeads(response.data.data ?? [])
        const pag = response.data.pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load leads')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Leads" description="Manage leads and pipeline" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Leads" description="Manage captured leads and track pipeline progress" />

      {loading && !leads.length ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary">Search</Button>
            </form>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(search || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter('all'); setPage(0) }}
              >
                Clear filters
              </Button>
            )}
            <p className="text-xs text-muted-foreground ml-auto">Click a row to view details</p>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / Handle</TableHead>
                  <TableHead>Source / Platform</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Captured</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => {
                    const handle = getLeadHandle(lead)
                    const source = getLeadSource(lead)
                    const capturedDate = lead.captured_at || lead.created_at
                    return (
                      <TableRow
                        key={lead._id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/admin/leads/${lead._id}`)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{getLeadName(lead)}</p>
                            {handle && <p className="text-xs text-muted-foreground">{handle}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {source !== '—' ? (
                            <Badge variant="outline" className="capitalize">{source}</Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {lead.tags && lead.tags.length > 0 ? (
                              lead.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                              ))
                            ) : '—'}
                            {lead.tags && lead.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">+{lead.tags.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={lead.status} />
                        </TableCell>
                        <TableCell>
                          {lead.score !== undefined ? (
                            <span className={`font-medium ${lead.score >= 70 ? 'text-green-600' : lead.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {lead.score}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {safeFormat(capturedDate)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} leads</p>
            <PaginationControls
              page={page}
              totalPages={pagination.total_pages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
