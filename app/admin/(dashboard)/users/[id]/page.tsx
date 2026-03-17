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
import { ArrowLeft, Trash2, CreditCard, Edit2 } from 'lucide-react'

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<AdminUser | null>(null)
  const [credits, setCredits] = useState<any>(null)
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
      if (userRes.status === 'fulfilled' && userRes.value.data) {
        const u = userRes.value.data as AdminUser
        setUser(u)
        setEditRole(u.role)
        setEditStatus(u.status)
      }
      if (creditsRes.status === 'fulfilled' && creditsRes.value.data) {
        setCredits(creditsRes.value.data)
      }
    } catch (err) {
      setError('Failed to load user')
    } finally {
      setLoading(false)
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
      if (res.data) setUser(res.data as AdminUser)
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
      const res = await usersApi.getCredits(userId)
      if (res.data) setCredits(res.data)
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
                  <div className="mt-1">
                    <StatusBadge status={user.status} />
                  </div>
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
                <p className="text-sm mt-1">{format(new Date(user.created_at), 'PPP')}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Last Updated</Label>
                <p className="text-sm mt-1">{format(new Date(user.updated_at), 'PPP')}</p>
              </div>
            </div>

            {editMode && (
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditMode(false)
                    setEditRole(user.role)
                    setEditStatus(user.status)
                  }}
                >
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
            <Button variant="ghost" size="sm" onClick={() => setShowCreditDialog(true)}>
              <CreditCard className="h-4 w-4 mr-1" />
              Adjust
            </Button>
          </CardHeader>
          <CardContent>
            {credits ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Current Balance</Label>
                  <p className="text-3xl font-bold mt-1">
                    {(credits.balance ?? credits.credits ?? credits.amount ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {credits.total_earned !== undefined && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Earned</Label>
                      <p className="text-sm font-medium mt-1">{credits.total_earned.toLocaleString()}</p>
                    </div>
                  )}
                  {credits.total_spent !== undefined && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Spent</Label>
                      <p className="text-sm font-medium mt-1">{credits.total_spent.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                {credits.updated_at && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Updated</Label>
                    <p className="text-sm mt-1">{format(new Date(credits.updated_at), 'PPP')}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No credit data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{user.email}</strong>? This action cannot be undone and will remove all associated data.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Credits Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Amount</Label>
              <p className="text-xs text-muted-foreground mb-1">Use a negative number to deduct credits</p>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="e.g. 100 or -50"
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
            <Button variant="outline" onClick={() => setShowCreditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdjustCredits}
              disabled={saving || !creditAmount || !creditReason}
            >
              {saving ? 'Applying...' : 'Apply Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
