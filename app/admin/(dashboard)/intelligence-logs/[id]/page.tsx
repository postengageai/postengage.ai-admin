'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { intelligenceLogsApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Activity, Cpu, DollarSign } from 'lucide-react'

const safeFormat = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export default function IntelligenceLogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const logId = params.id as string

  const [log, setLog] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await intelligenceLogsApi.getById(logId)
        const data = (res.data as any)?.data
        if (data) setLog(data)
        else setError('Log entry not found')
      } catch (err) {
        setError('Failed to load log entry')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [logId])

  if (loading) return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>

  if (error || !log) {
    return (
      <div>
        <AdminPageHeader title="Intelligence Log" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error || 'Not found'}</div>
      </div>
    )
  }

  const totalTokens = log.tokens ?? ((log.input_tokens ?? 0) + (log.output_tokens ?? 0))

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Intelligence Log Entry"
        description={`ID: ${log._id}`}
        action={
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/intelligence-logs')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Latency</p>
            <p className={`text-xl font-bold mt-1 ${log.latency > 3000 ? 'text-amber-600' : 'text-green-600'}`}>
              {log.latency != null ? `${log.latency}ms` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Tokens</p>
            <p className="text-xl font-bold mt-1">{totalTokens || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Cost</p>
            <p className="text-xl font-bold mt-1">
              {log.cost != null ? `$${Number(log.cost).toFixed(5)}` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Type</p>
            <Badge variant="outline" className="capitalize mt-1 text-xs">
              {(log.type || '—').replace(/_/g, ' ')}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Log Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Log Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {log.model && (
              <div>
                <Label className="text-xs text-muted-foreground">Model</Label>
                <p className="text-sm font-mono mt-1">{log.model}</p>
              </div>
            )}
            {log.bot_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Bot</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/bots/${log.bot_id}`)}
                >
                  {log.bot_id}
                </p>
              </div>
            )}
            {log.user_id && (
              <div>
                <Label className="text-xs text-muted-foreground">User</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/users/${log.user_id}`)}
                >
                  {log.user_id}
                </p>
              </div>
            )}
            {log.conversation_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Conversation</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/conversations/${log.conversation_id}`)}
                >
                  {log.conversation_id}
                </p>
              </div>
            )}
            {(log.input_tokens || log.output_tokens) && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <Label className="text-xs text-muted-foreground">Input Tokens</Label>
                  <p className="text-sm font-medium mt-1">{log.input_tokens ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Output Tokens</Label>
                  <p className="text-sm font-medium mt-1">{log.output_tokens ?? '—'}</p>
                </div>
              </div>
            )}
            <div className="pt-2 border-t">
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="text-sm mt-1">{safeFormat(log.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Token & Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Performance Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {log.prompt_slug && (
              <div>
                <Label className="text-xs text-muted-foreground">Prompt Slug</Label>
                <p className="text-sm font-mono mt-1">{log.prompt_slug}</p>
              </div>
            )}
            {log.prompt_version && (
              <div>
                <Label className="text-xs text-muted-foreground">Prompt Version</Label>
                <p className="text-sm mt-1">v{log.prompt_version}</p>
              </div>
            )}
            {log.error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <Label className="text-xs text-destructive">Error</Label>
                <p className="text-sm mt-1 text-destructive font-mono">{log.error}</p>
              </div>
            )}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Metadata</Label>
                <div className="space-y-1">
                  {Object.entries(log.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{k.replace(/_/g, ' ')}</span>
                      <span className="font-mono">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prompt Content */}
      {(log.prompt || log.input) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prompt / Input</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted/40 p-3 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap break-words">
              {log.prompt || log.input}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Response Content */}
      {(log.response || log.output) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Response / Output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted/40 p-3 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap break-words">
              {typeof (log.response || log.output) === 'object'
                ? JSON.stringify(log.response || log.output, null, 2)
                : (log.response || log.output)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
