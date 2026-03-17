'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useParams, useRouter } from 'next/navigation'
import { leadsApi, AdminLead } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ArrowLeft, Trash2, Edit2 } from 'lucide-react'

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
]

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  const [lead, setLead] = useState<AdminLead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editStatus, setEditStatus] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    const loadLead = async () => {
      try {
        setLoading(true)
        const res = await leadsApi.getById(leadId)
        if (res.data) {
          const l = res.data as AdminLead
          setLead(l)
          setEditStatus(l.status)
        }
      } catch (err) {
        setError('Failed to load lead')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadLead()
  }, [leadId])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const handleSave = async () => {
    if (!lead) return
    try {
      setSaving(true)
      const res = await leadsApi.update(leadId, { status: editStatus })
      if (res.data) setLead(res.data as AdminLead)
      setEditMode(false)
      showSuccess('Lead updated successfully')
    } catch (err) {
      console.error('Failed to update lead', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await leadsApi.delete(leadId)
      router.push('/admin/leads')
    } catch (err) {
      console.error('Failed to delete lead', err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>
  }

  if (error || !lead) {
    return (
      <div>
        <AdminPageHeader title="Lead Detail" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">
          {error || 'Lead not found'}
        </div>
      </div>
    )
  }

  const scoreColor = lead.score !== undefined
    ? lead.score >= 70 ? 'text-green-600' : lead.score >= 40 ? 'text-yellow-600' : 'text-red-600'
    : ''

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={lead.name || lead.email || 'Lead Detail'}
        description={`Lead ID: ${lead._id}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/leads')}>
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
        {/* Lead Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Lead Information</CardTitle>
            {!editMode && (
              <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                <Edit2 className="h-4 w-4 mr-1" />
                Edit Status
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {lead.name && (
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-sm font-medium mt-1">{lead.name}</p>
              </div>
            )}
            {lead.email && (
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm mt-1">{lead.email}</p>
              </div>
            )}
            {lead.phone && (
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <p className="text-sm mt-1">{lead.phone}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Source</Label>
              <div className="mt-1">
                <Badge variant="outline">{lead.source}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              {editMode ? (
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1">
                  <StatusBadge status={lead.status} />
                </div>
              )}
            </div>
            {lead.score !== undefined && (
              <div>
                <Label className="text-xs text-muted-foreground">Lead Score</Label>
                <p className={`text-2xl font-bold mt-1 ${scoreColor}`}>{lead.score}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="text-sm mt-1">{format(new Date(lead.created_at), 'PPP p')}</p>
            </div>

            {editMode && (
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setEditMode(false); setEditStatus(lead.status) }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity / Timeline placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">Update the lead status to track pipeline progress.</p>
            {statusOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={lead.status === opt.value ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                disabled={saving || lead.status === opt.value}
                onClick={async () => {
                  try {
                    setSaving(true)
                    const res = await leadsApi.update(leadId, { status: opt.value })
                    if (res.data) setLead(res.data as AdminLead)
                    showSuccess(`Status updated to ${opt.label}`)
                  } catch (err) {
                    console.error(err)
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                {lead.status === opt.value ? '✓ ' : ''}{opt.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this lead? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
