'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usersApi, creditsApi, AdminUser } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { PaginationControls } from '@/components/admin/pagination-controls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { CreditCard, Search, RefreshCw } from 'lucide-react'

interface UserWithCredits extends AdminUser {
  credits?: { balance: number; total_used: number; total_earned: number } | null
  creditsLoading?: boolean
}

const safeDate = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

export default function CreditsPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserWithCredits[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [adjustTarget, setAdjustTarget] = useState<UserWithCredits | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditReason, setCreditReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadCreditsForUsers = async (ids: string[]) => {
    setUsers(prev => prev.map(u => ids.includes(u._id) ? { ...u, creditsLoading: true } : u))
    const results = await Promise.allSettled(
      ids.map(id => usersApi.getCredits(id).then(res => ({ id, data: (res.data as any)?.data })))
    )
    setUsers(prev => prev.map(u => {
      const r = results.find(x => x.status === 'fulfilled' && (x.value as any).id === u._id)
      if (r?.status === 'fulfilled') {
        const c = (r.value as any).data
        return {
          ...u, creditsLoading: false, credits: c ? {
            balance: c.balance ?? c.credits ?? 0,
            total_used: c.total_used ?? c.total_spent ?? 0,
            total_earned: c.total_earned ?? ((c.balance ?? 0) + (c.total_used ?? 0)),
          } : null
        }
      }
      return { ...u, creditsLoading: false }
    }))
  }

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await usersApi.list({ page: page + 1, limit: 10, ...(search && { search }) })
      if (response.data) {
        const rawUsers = (response.data.data ?? []) as AdminUser[]
        setUsers(rawUsers.map(u => ({ ...u, creditsLoading: false, credits: null })))
        const pag = response.data.pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
        loadCreditsForUsers(rawUsers.map(u => u._id))
      }
    } catch (err) {
      setError('Failed to load users')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setSearch(searchInput); setPage(0)
  }

  const handleAdjust = async () => {
    if (!adjustTarget) return
    const amount = parseInt(creditAmount)
    if (isNaN(amount) || !creditReason.trim()) return
    try {
      setAdjusting(true)
      await creditsApi.adjust(adjustTarget._id, { amount, reason: creditReason })
      const res = await usersApi.getCredits(adjustTarget._id)
      const c = (res.data as any)?.data
      setUsers(prev => prev.map(u => u._id === adjustTarget._id ? {
        ...u, credits: c ? {
          balance: c.balance ?? 0,
          total_used: c.total_used ?? 0,
          total_earned: c.total_earned ?? 0
        } : u.credits
      } : u))
      setCreditAmount(''); setCreditReason(''); setAdjustTarget(null)
      setSuccessMsg('Credits adjusted successfully')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      console.error('Failed to adjust credits', err)
    } finally {
      setAdjusting(false)
    }
  }

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Credit Balances" description="View and manage user credit balances" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Credit Balances" description="View and adjust credit balances per user" />

      {successMsg && (
        <div className="text-green-700 text-sm p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          {successMsg}
        </div>
      )}

      {loading && !users.length ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary">Search</Button>
            </form>
            {search && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSearchInput(''); setPage(0) }}>
                Clear
              </Button>
            )}
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Total Used</TableHead>
                  <TableHead>Total Earned</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
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
                    <TableRow key={user._id}>
                      <TableCell>
                        <p
                          className="font-medium text-primary cursor-pointer hover:underline text-sm"
                          onClick={() => router.push(`/admin/users/${user._id}`)}
                        >
                          {user.email}
                        </p>
                        {(user.first_name || user.last_name) && (
                          <p className="text-xs text-muted-foreground">
                            {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.creditsLoading
                          ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          : <span className="font-bold text-lg">{user.credits?.balance.toLocaleString() ?? '—'}</span>
                        }
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.creditsLoading ? '...' : (user.credits?.total_used.toLocaleString() ?? '—')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.creditsLoading ? '...' : (user.credits?.total_earned.toLocaleString() ?? '—')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {safeDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => { setAdjustTarget(user); setCreditAmount(''); setCreditReason('') }}
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} users</p>
            <PaginationControls page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <Dialog open={!!adjustTarget} onOpenChange={(open) => !open && setAdjustTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Credits — {adjustTarget?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/40 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold">
                {adjustTarget?.credits?.balance.toLocaleString() ?? '—'}
              </p>
            </div>
            <div>
              <Label>Amount <span className="text-muted-foreground text-xs">(negative to deduct)</span></Label>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="e.g. 100 or -50"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="Reason for adjustment"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustTarget(null)}>Cancel</Button>
            <Button
              onClick={handleAdjust}
              disabled={adjusting || !creditAmount || !creditReason}
            >
              {adjusting ? 'Applying...' : 'Apply Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
