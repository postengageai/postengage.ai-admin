'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { leadsApi, AdminLead } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { ArrowLeft, Trash2, Edit2, User, Tag, Globe, Clock } from 'lucide-react'

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
]

const safeFormat = (date: string | null | undefined, opts?: Intl.DateTimeFormatOptions) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', opts ?? { month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

const getLeadName = (lead: AdminLead) => lead.full_name || lead.name || lead.email || 'Lead Detail'
const getLeadSource = (lead: AdminLead) => lead.captured_from || lead.source || '—'

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
  const [editNotes, setEditNotes] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    const loadLead = async () => {
      try {
        setLoading(true)
        const res = await leadsApi.getById(leadId)
        // Response wrapped: res.data = { success: true, data: {...lead} }
        const l = (res.data as any)?.data as AdminLead
        if (l) {
          setLead(l)
          setEditStatus(l.status || 'new')
          setEditNotes(l.notes || '')
        } else {
          setError('Lead not found')
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
      const res = await leadsApi.update(leadId, { status: editStatus, notes: editNotes })
      const updated = (res.data as any)?.data as AdminLead
      if (updated) setLead(updated)
      else setLead({ ...lead, status: editStatus, notes: editNotes })
      setEditMode(false)
      showSuccess('Lead updated successfully')
    } catch (err) {
      console.error('Failed to update lead', err)
    } finally {
      setSaving(false)
    }
  }

  const handleQuickStatus = async (status: string) => {
    if (!lead) return
    try {
      setSaving(true)
      const res = await leadsApi.update(leadId, { status })
      const updated = (res.data as any)?.data as AdminLead
      if (updated) setLead(updated)
      else setLead({ ...lead, status })
      showSuccess(`Status updated to ${statusOptions.find(s => s.value === status)?.label || status}`)
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

  const source = getLeadSource(lead)
  const scoreColor = lead.score !== undefined
    ? lead.score >= 70 ? 'text-green-600' : lead.score >= 40 ? 'text-yellow-600' : 'text-red-600'
    : ''

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={getLeadName(lead)}
        description={`Lead ID: ${lead._id}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/leads')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
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
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            {(lead.full_name || lead.name) && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" /> Name
                </Label>
                <p className="text-sm font-medium mt-1">{lead.full_name || lead.name}</p>
              </div>
            )}

            {/* Email */}
            {lead.email && (
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm mt-1">{lead.email}</p>
              </div>
            )}

            {/* Phone */}
            {lead.phone && (
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <p className="text-sm mt-1">{lead.phone}</p>
              </div>
            )}

            {/* Social Profiles */}
            {lead.social_profiles && lead.social_profiles.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Social Profiles
                </Label>
                <div className="mt-1 space-y-1">
                  {lead.social_profiles.map((sp, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {sp.platform && (
                        <Badge variant="outline" className="text-xs capitalize">{sp.platform}</Badge>
                      )}
                      {sp.username && (
                        <span className="text-sm">@{sp.username}</span>
                      )}
                      {sp.url && !sp.username && (
                        <a href={sp.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate max-w-[200px]">
                          {sp.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source / Captured From */}
            <div>
              <Label className="text-xs text-muted-foreground">Source / Platform</Label>
              <div className="mt-1">
                <Badge variant="outline" className="capitalize">{source}</Badge>
              </div>
            </div>

            {/* Status */}
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              {editMode ? (
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1">
                  <StatusBadge status={lead.status} />
                </div>
              )}
            </div>

            {/* Score */}
            {lead.score !== undefined && (
              <div>
                <Label className="text-xs text-muted-foreground">Lead Score</Label>
                <p className={`text-2xl font-bold mt-1 ${scoreColor}`}>{lead.score}</p>
              </div>
            )}

            {/* Tags */}
            {lead.tags && lead.tags.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {lead.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label className="text-xs text-muted-foreground">Notes</Label>
              {editMode ? (
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  className="mt-1 text-sm min-h-[80px] resize-none"
                />
              ) : (
                <p className="text-sm mt-1 text-muted-foreground">{lead.notes || '—'}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Captured
                </Label>
                <p className="text-sm mt-1">{safeFormat(lead.captured_at || lead.created_at)}</p>
              </div>
              {lead.last_engaged && (
                <div>
                  <Label className="text-xs text-muted-foreground">Last Engaged</Label>
                  <p className="text-sm mt-1">{safeFormat(lead.last_engaged)}</p>
                </div>
              )}
            </div>

            {/* Linked IDs */}
            {lead.user_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Owner (User ID)</Label>
                <p
                  className="text-sm mt-1 font-mono text-primary cursor-pointer hover:underline"
                  onClick={() => router.push(`/admin/users/${lead.user_id}`)}
                >
                  {lead.user_id}
                </p>
              </div>
            )}

            {/* Edit actions */}
            {editMode && (
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setEditMode(false)
                  setEditStatus(lead.status || 'new')
                  setEditNotes(lead.notes || '')
                }}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Status Update</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              Move this lead through your pipeline by clicking a status below.
            </p>
            {statusOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={lead.status === opt.value ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                disabled={saving || lead.status === opt.value}
                onClick={() => handleQuickStatus(opt.value)}
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
            Are you sure you want to delete the lead for <strong>{getLeadName(lead)}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
