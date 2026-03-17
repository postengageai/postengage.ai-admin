'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useParams, useRouter } from 'next/navigation'
import { usersApi, AdminUser, creditsApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Trash2, CreditCard, Edit2, History } from 'lucide-react'

// Safe date formatting - avoids RangeError if date is null/undefined/invalid
const safeFormat = (date: string | null | undefined, fmt: string) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return format(d, fmt)
  } catch {
    return '—'
  }
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<AdminUser | null>(null)
  const [credits, setCredits] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCreditDialog, setShowCreditDialog] = useState(false)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditReason, setCreditReason] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
  }, [userId])

  const loadUser = async () => {
    try {
      setLoading(true)
      const [userRes, creditsRes] = await Promise.allSettled([
        usersApi.getById(userId),
        usersApi.getCredits(userId),
      ])
      if (userRes.status === 'fulfilled') {
        // getById response: axios_res.data = { success: true, data: {...user} }
        const u = (userRes.value.data as any)?.data as AdminUser
        if (u) {
          setUser(u)
          setEditRole(u.role)
          setEditStatus(u.status)
        }
      }
      if (creditsRes.status === 'fulfilled') {
        const cData = (creditsRes.value.data as any)?.data
        setCredits(cData ?? null)
      }
    } catch (err) {
      setError('Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      setTxLoading(true)
      const res = await creditsApi.getByUser(userId)
      const txData = (res.data as any)?.data
      setTransactions(Array.isArray(txData) ? txData : [])
    } catch (err) {
      console.error('Failed to load transactions', err)
    } finally {
      setTxLoading(false)
    }
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const handleSave = async () => {
    if (!user) return
    try {
      setSaving(true)
      const res = await usersApi.update(userId, { role: editRole, status: editStatus })
      const updated = (res.data as any)?.data as AdminUser
      if (updated) setUser(updated)
      setEditMode(false)
      showSuccess('User updated successfully')
    } catch (err) {
      console.error('Failed to update user', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await usersApi.delete(userId)
      router.push('/admin/users')
    } catch (err) {
      console.error('Failed to delete user', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleAdjustCredits = async () => {
    const amount = parseInt(creditAmount)
    if (isNaN(amount) || !creditReason) return
    try {
      setSaving(true)
      await creditsApi.adjust(userId, { amount, reason: creditReason })
      setCreditAmount('')
      setCreditReason('')
      setShowCreditDialog(false)
      // Reload credits
      const res = await usersApi.getCredits(userId)
      const cData = (res.data as any)?.data
      setCredits(cData ?? null)
      // Reload tx if visible
      if (transactions.length > 0) loadTransactions()
      showSuccess('Credits adjusted successfully')
    } catch (err) {
      console.error('Failed to adjust credits', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>
  }

  if (error || !user) {
    return (
      <div>
        <AdminPageHeader title="User Detail" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">
          {error || 'User not found'}
        </div>
      </div>
    )
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || '—'
  const balance = credits?.balance ?? credits?.credits ?? 0
  const totalUsed = credits?.total_used ?? credits?.total_spent ?? 0

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={user.email}
        description={`ID: ${user._id}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        }
      />

      {successMsg && (
        <div className="text-green-700 text-sm p-3 bg-green-50 border border-green-200 rounded-lg">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">User Information</CardTitle>
            {!editMode && (
              <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm font-medium mt-1">{user.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <p className="text-sm mt-1">{fullName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Role</Label>
                {editMode ? (
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge variant={user.role === 'admin' || user.role === 'superadmin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                {editMode ? (
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1"><StatusBadge status={user.status} /></div>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email Verification</Label>
              <div className="mt-1">
                <Badge variant={user.is_verified ? 'default' : 'secondary'}>
                  {user.is_verified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Joined</Label>
                <p className="text-sm mt-1">{safeFormat(user.created_at, 'PPP')}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Last Updated</Label>
                <p className="text-sm mt-1">{safeFormat(user.updated_at, 'PPP')}</p>
              </div>
            </div>
            {editMode && (
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setEditMode(false); setEditRole(user.role); setEditStatus(user.status)
                }}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Credits</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => {
                setShowCreditDialog(true)
              }}>
                <CreditCard className="h-4 w-4 mr-1" />
                Adjust
              </Button>
              <Button variant="ghost" size="sm" onClick={() => {
                if (transactions.length === 0) loadTransactions()
                else setTransactions([])
              }}>
                <History className="h-4 w-4 mr-1" />
                History
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/40 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Balance</p>
                <p className="text-2xl font-bold">{balance.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 bg-muted/40 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Total Used</p>
                <p className="text-2xl font-bold">{totalUsed.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 bg-muted/40 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
                <p className="text-2xl font-bold">
                  {(credits?.total_earned ?? (balance + totalUsed)).toLocaleString()}
                </p>
              </div>
            </div>
            {credits?.updated_at && (
              <p className="text-xs text-muted-foreground">
                Last updated: {safeFormat(credits.updated_at, 'PPP p')}
              </p>
            )}

            {/* Transaction history (lazy-loaded) */}
            {txLoading && <p className="text-xs text-muted-foreground">Loading transactions...</p>}
            {transactions.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Reason</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 10).map((tx: any) => (
                      <TableRow key={tx._id}>
                        <TableCell className={`text-sm font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </TableCell>
                        <TableCell className="text-xs capitalize">{tx.type || '—'}</TableCell>
                        <TableCell className="text-xs">{tx.reason || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {safeFormat(tx.created_at, 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{user.email}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Credits Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Credits for {user.email}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/40 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold">{balance.toLocaleString()}</p>
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
            <Button variant="outline" onClick={() => setShowCreditDialog(false)}>Cancel</Button>
            <Button onClick={handleAdjustCredits} disabled={saving || !creditAmount || !creditReason}>
              {saving ? 'Applying...' : 'Apply Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
