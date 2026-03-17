'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { automationsApi, AdminAutomation } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { StatCard } from '@/components/admin/stat-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ArrowLeft, Trash2, Zap, CheckCircle2, XCircle, Clock } from 'lucide-react'

const safeFormat = (date: string | null | undefined, withTime?: boolean) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    if (withTime) {
      return d.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    }
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

export default function AutomationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const automationId = params.id as string

  const [automation, setAutomation] = useState<AdminAutomation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const loadAutomation = async () => {
      try {
        setLoading(true)
        const res = await automationsApi.getById(automationId)
        // Response wrapped: res.data = { success: true, data: {...automation} }
        const data = (res.data as any)?.data as AdminAutomation
        if (data) setAutomation(data)
        else setError('Automation not found')
      } catch (err) {
        setError('Failed to load automation')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadAutomation()
  }, [automationId])

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await automationsApi.delete(automationId)
      router.push('/admin/automations')
    } catch (err) {
      console.error('Failed to delete automation', err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>
  }

  if (error || !automation) {
    return (
      <div>
        <AdminPageHeader title="Automation Detail" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">
          {error || 'Automation not found'}
        </div>
      </div>
    )
  }

  const executions = automation.execution_count ?? automation.trigger_count ?? 0
  const successRate = executions > 0 && automation.success_count !== undefined
    ? Math.round((automation.success_count / executions) * 100)
    : null

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={automation.name}
        description={`Automation ID: ${automation._id}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/automations')}>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Executions" value={executions.toLocaleString()} icon={Zap} />
        <StatCard title="Successful" value={(automation.success_count || 0).toLocaleString()} icon={CheckCircle2} />
        <StatCard title="Failed" value={(automation.failure_count || 0).toLocaleString()} icon={XCircle} />
        <StatCard title="Success Rate" value={successRate !== null ? `${successRate}%` : '—'} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Automation Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Automation Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="text-sm font-medium mt-1">{automation.name}</p>
            </div>
            {automation.description && (
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{automation.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1"><StatusBadge status={automation.status} /></div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Platform</Label>
                <div className="mt-1">
                  <Badge variant="outline" className="capitalize">{automation.platform || '—'}</Badge>
                </div>
              </div>
            </div>
            {automation.trigger_type && (
              <div>
                <Label className="text-xs text-muted-foreground">Trigger Type</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className="capitalize">{automation.trigger_type.replace(/_/g, ' ')}</Badge>
                </div>
              </div>
            )}
            {automation.action_type && (
              <div>
                <Label className="text-xs text-muted-foreground">Action Type</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className="capitalize">{automation.action_type.replace(/_/g, ' ')}</Badge>
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Owner (User ID)</Label>
              <p
                className="text-sm mt-1 font-mono text-primary cursor-pointer hover:underline"
                onClick={() => router.push(`/admin/users/${automation.user_id}`)}
              >
                {automation.user_id}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Created
                </Label>
                <p className="text-sm mt-1">{safeFormat(automation.created_at)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Last Run</Label>
                <p className="text-sm mt-1">{safeFormat(automation.last_run_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trigger/Action Config */}
        <div className="space-y-4">
          {automation.trigger_config && Object.keys(automation.trigger_config).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Trigger Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(automation.trigger_config).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between py-1 border-b last:border-0">
                    <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-medium text-right max-w-[60%]">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {automation.action_config && Object.keys(automation.action_config).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Action Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(automation.action_config).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between py-1 border-b last:border-0">
                    <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-medium text-right max-w-[60%]">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(!automation.trigger_config || Object.keys(automation.trigger_config).length === 0) &&
           (!automation.action_config || Object.keys(automation.action_config).length === 0) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Configuration</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No additional configuration</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Automation</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{automation.name}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Automation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
