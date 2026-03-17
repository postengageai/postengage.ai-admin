'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  operationModelConfigsApi,
  type OperationModelConfig,
  type OperationTypeLiteral,
  type LlmProviderLiteral,
} from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Cpu, Trash2, Save, Plus, RefreshCw } from 'lucide-react'

// ─── Operation display labels ─────────────────────────────────────────────────

const OPERATION_LABELS: Record<OperationTypeLiteral, string> = {
  intent_classification: 'Intent Classification',
  response_generation: 'Response Generation',
  voice_dna_analysis: 'Voice DNA Analysis',
  memory_consolidation: 'Memory Consolidation',
  entity_extraction: 'Entity Extraction',
  knowledge_retrieval: 'Knowledge Retrieval',
}

const OPERATION_DESCRIPTIONS: Record<OperationTypeLiteral, string> = {
  intent_classification: 'Classifies user intent (purchase, complaint, etc.) — can use a cheaper/faster model',
  response_generation: 'Generates bot replies — use the best quality model here',
  voice_dna_analysis: 'Analyzes writing style to build brand voice profiles',
  memory_consolidation: 'Summarises conversation history into long-term memories',
  entity_extraction: 'Extracts structured entities (names, products, dates) from messages',
  knowledge_retrieval: 'Retrieves relevant knowledge base chunks for a query',
}

const PROVIDER_LABELS: Record<LlmProviderLiteral, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
  google: 'Google (Gemini)',
  groq: 'Groq (Llama)',
  ollama: 'Ollama (Local)',
}

const PROVIDER_SUGGESTED_MODELS: Record<LlmProviderLiteral, string[]> = {
  anthropic: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-5-20251101'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  ollama: ['llama3.1:8b', 'llama3.2:3b', 'mistral:7b'],
}

// ─── Inline editor component ──────────────────────────────────────────────────

function OperationRow({
  operation,
  existingConfig,
  onSave,
  onDelete,
  onToggle,
}: {
  operation: OperationTypeLiteral
  existingConfig: OperationModelConfig | undefined
  onSave: (op: OperationTypeLiteral, provider: LlmProviderLiteral, model: string, desc: string) => Promise<void>
  onDelete: (op: OperationTypeLiteral) => Promise<void>
  onToggle: (op: OperationTypeLiteral, enabled: boolean) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [provider, setProvider] = useState<LlmProviderLiteral>(existingConfig?.provider ?? 'anthropic')
  const [model, setModel] = useState(existingConfig?.model ?? '')
  const [description, setDescription] = useState(existingConfig?.description ?? '')
  const [saving, setSaving] = useState(false)

  // Reset form when config changes
  useEffect(() => {
    if (existingConfig) {
      setProvider(existingConfig.provider)
      setModel(existingConfig.model)
      setDescription(existingConfig.description ?? '')
    }
  }, [existingConfig])

  const handleSave = async () => {
    if (!model.trim()) return
    setSaving(true)
    try {
      await onSave(operation, provider, model.trim(), description.trim())
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const suggestedModels = PROVIDER_SUGGESTED_MODELS[provider] ?? []

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-primary shrink-0" />
              {OPERATION_LABELS[operation]}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {OPERATION_DESCRIPTIONS[operation]}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {existingConfig && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {existingConfig.is_enabled ? 'Active' : 'Disabled'}
                </span>
                <Switch
                  checked={existingConfig.is_enabled}
                  onCheckedChange={(v) => onToggle(operation, v)}
                />
              </div>
            )}
            {!editing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
              >
                {existingConfig ? 'Edit' : <><Plus className="h-3.5 w-3.5 mr-1" />Set</>}
              </Button>
            )}
            {existingConfig && !editing && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => onDelete(operation)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Current config badge (non-edit mode) */}
      {!editing && existingConfig && (
        <CardContent className="pt-0 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="capitalize text-xs">{PROVIDER_LABELS[existingConfig.provider] ?? existingConfig.provider}</Badge>
            <Badge variant="outline" className="font-mono text-xs">{existingConfig.model}</Badge>
            {existingConfig.description && (
              <span className="text-xs text-muted-foreground">{existingConfig.description}</span>
            )}
          </div>
        </CardContent>
      )}

      {/* No config badge */}
      {!editing && !existingConfig && (
        <CardContent className="pt-0 pb-3">
          <p className="text-xs text-muted-foreground/60 italic">
            Using ENV / global default — click Set to override
          </p>
        </CardContent>
      )}

      {/* Edit form */}
      {editing && (
        <CardContent className="pt-0 pb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Provider</Label>
              <Select value={provider} onValueChange={(v) => { setProvider(v as LlmProviderLiteral); setModel('') }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROVIDER_LABELS) as LlmProviderLiteral[]).map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">{PROVIDER_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Model</Label>
              <div className="flex gap-1.5">
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. claude-haiku-4-5-20251001"
                  className="h-8 text-xs font-mono flex-1"
                />
              </div>
              {suggestedModels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {suggestedModels.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModel(m)}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted/30 hover:bg-muted transition-colors"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this model was chosen..."
              className="h-8 text-xs"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={saving || !model.trim()}
              onClick={handleSave}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OperationModelConfigsPage() {
  const [configs, setConfigs] = useState<OperationModelConfig[]>([])
  const [operations, setOperations] = useState<OperationTypeLiteral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await operationModelConfigsApi.list()
      const data = (res.data as any)?.data
      if (data) {
        setConfigs(data.configs ?? [])
        setOperations(data.supported_operations ?? [])
      }
    } catch {
      setError('Failed to load operation model configs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (
    operation: OperationTypeLiteral,
    provider: LlmProviderLiteral,
    model: string,
    description: string,
  ) => {
    await operationModelConfigsApi.upsert(operation, { provider, model, is_enabled: true, description })
    await load()
  }

  const handleDelete = async (operation: OperationTypeLiteral) => {
    if (!confirm(`Remove override for '${operation}'? Pipeline will fall back to ENV / global defaults.`)) return
    await operationModelConfigsApi.remove(operation)
    await load()
  }

  const handleToggle = async (operation: OperationTypeLiteral, is_enabled: boolean) => {
    await operationModelConfigsApi.toggle(operation, is_enabled)
    await load()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Operation Model Configs"
        description="Override the LLM provider and model for each pipeline operation (Tier 3 of the resolution hierarchy)"
        action={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Resolution hierarchy card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs font-semibold text-primary mb-2">Resolution Hierarchy (first match wins)</p>
          <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
            <li><strong>User BYOM per-operation</strong> — user&apos;s own API key + per-operation model</li>
            <li><strong>User global BYOM</strong> — user&apos;s own API key + preferred_model</li>
            <li className="text-foreground font-medium"><strong>Admin per-operation (this page)</strong> ← you are here</li>
            <li><strong>ENV per-operation</strong> — LLM_PROVIDER_&#123;OP&#125; / LLM_MODEL_&#123;OP&#125;</li>
            <li><strong>ENV global</strong> — LLM_DEFAULT_PROVIDER / *_MODEL</li>
          </ol>
        </CardContent>
      </Card>

      {error && (
        <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-lg">{error}</div>
      )}

      {loading && operations.length === 0 ? (
        <div className="text-muted-foreground text-sm text-center py-8">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {operations.map((op) => (
            <OperationRow
              key={op}
              operation={op}
              existingConfig={configs.find((c) => c.operation === op)}
              onSave={handleSave}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
