'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { PromptDefinition } from '@/lib/api/admin'
import { promptsApi } from '@/lib/api/admin'
import { PromptDefinitionCard } from '@/components/admin/prompts/prompt-definition-card'

const PROMPT_TYPES = [
  'intent_classification',
  'response_generation',
  'voice_dna_analysis',
  'few_shot_curation',
  'entity_extraction',
  'bot_simulation',
  'content_moderation',
  'custom',
]

const PROMPT_ROLES = ['system', 'user', 'combined']

interface CreateDefinitionForm {
  name: string
  slug: string
  type: string
  role: string
  description: string
  tags: string
}

export default function PromptsPage() {
  const [definitions, setDefinitions] = useState<PromptDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  const [showNewDialog, setShowNewDialog] = useState(false)
  const [creatingDefinition, setCreatingDefinition] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateDefinitionForm>({
    name: '',
    slug: '',
    type: PROMPT_TYPES[0],
    role: PROMPT_ROLES[0],
    description: '',
    tags: '',
  })

  useEffect(() => {
    loadDefinitions()
  }, [])

  const loadDefinitions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await promptsApi.listDefinitions()
      setDefinitions((response.data as any)?.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDefinition = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      setCreateError('Name and slug are required')
      return
    }

    try {
      setCreatingDefinition(true)
      setCreateError(null)

      const tagsArray = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const response = await promptsApi.createDefinition({
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        type: form.type,
        role: form.role,
        description: form.description.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      })

      setDefinitions([(response.data as any)?.data, ...definitions].filter(Boolean))
      setShowNewDialog(false)
      setForm({
        name: '',
        slug: '',
        type: PROMPT_TYPES[0],
        role: PROMPT_ROLES[0],
        description: '',
        tags: '',
      })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create definition')
    } finally {
      setCreatingDefinition(false)
    }
  }

  const filteredDefinitions = definitions.filter((def) => {
    const matchesSearch =
      def.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.slug.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = !filterType || def.type === filterType
    const matchesActive =
      filterActive === 'all' ||
      (filterActive === 'active' && def.is_active) ||
      (filterActive === 'inactive' && !def.is_active)

    return matchesSearch && matchesType && matchesActive
  })

  const totalDefinitions = definitions.length
  const activeDefinitions = definitions.filter((d) => d.is_active).length
  const totalVersions = definitions.reduce((sum, d) => sum + (d.latest_version_number || 0), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prompt Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage prompt definitions and versions with full version control
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          New Prompt
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Definitions</p>
            <p className="text-2xl font-semibold mt-2">{totalDefinitions}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Definitions</p>
            <p className="text-2xl font-semibold mt-2 text-emerald-600">{activeDefinitions}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Versions</p>
            <p className="text-2xl font-semibold mt-2">{totalVersions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border"
              />
            </div>

            <Select value={filterType || '__all__'} onValueChange={(v) => setFilterType(v === '__all__' ? null : v)}>
              <SelectTrigger className="sm:w-40 bg-muted/50 border-border">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                {PROMPT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterActive} onValueChange={(v) => setFilterActive(v as any)}>
              <SelectTrigger className="sm:w-40 bg-muted/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDefinitions.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDefinitions.map((def) => (
            <PromptDefinitionCard key={def._id} definition={def} onUpdated={loadDefinitions} />
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {definitions.length === 0 ? 'No prompts yet. Create your first prompt!' : 'No prompts match your filters.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* New Definition Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Prompt Definition</DialogTitle>
            <DialogDescription>Define a new prompt template and configuration</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., Intent Classifier v1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 bg-muted/50 border-border"
              />
            </div>

            <div>
              <Label htmlFor="slug" className="text-sm font-medium">
                Slug
              </Label>
              <div className="font-mono text-xs bg-muted/50 border border-border rounded-md px-3 py-2 mt-2">
                {form.slug || 'lowercase-with-hyphens'}
              </div>
              <Input
                id="slug"
                placeholder="intent-classifier-v1"
                value={form.slug}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                  })
                }
                className="mt-2 bg-muted/50 border-border"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="type" className="text-sm font-medium">
                  Type
                </Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger id="type" className="mt-2 bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMPT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role" className="text-sm font-medium">
                  Role
                </Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger id="role" className="mt-2 bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMPT_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what this prompt does..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-2 bg-muted/50 border-border min-h-20 resize-none"
              />
            </div>

            <div>
              <Label htmlFor="tags" className="text-sm font-medium">
                Tags (comma-separated, optional)
              </Label>
              <Input
                id="tags"
                placeholder="ai, classification, intent"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="mt-2 bg-muted/50 border-border"
              />
            </div>

            {createError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{createError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowNewDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCreateDefinition}
                disabled={creatingDefinition}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {creatingDefinition && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {creatingDefinition ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
