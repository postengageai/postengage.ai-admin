'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, ChevronRight, Loader2, Plus } from 'lucide-react'
import type { PromptDefinition, PromptVersion } from '@/lib/api/admin'
import { promptsApi } from '@/lib/api/admin'
import { VersionEditorDialog } from '@/components/admin/prompts/version-editor-dialog'
import { VersionPreviewDialog } from '@/components/admin/prompts/version-preview-dialog'
import { VersionHistoryTimeline } from '@/components/admin/prompts/version-history-timeline'

export default function PromptDetailPage() {
  const params = useParams()
  const definitionId = params.id as string

  const [definition, setDefinition] = useState<PromptDefinition | null>(null)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingDef, setEditingDef] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    notes: '',
  })

  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false)
  const [previewVersion, setPreviewVersion] = useState<PromptVersion | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  useEffect(() => {
    loadData()
  }, [definitionId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await promptsApi.getDefinition(definitionId)
      setDefinition(response.data!.data.definition)
      setVersions(response.data!.data.versions)

      setFormData({
        name: response.data!.data.definition.name,
        description: response.data!.data.definition.description || '',
        tags: (response.data!.data.definition.tags || []).join(', '),
        notes: response.data!.data.definition.notes || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompt')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDefinition = async () => {
    if (!definition) return

    try {
      const tagsArray = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const response = await promptsApi.updateDefinition(definitionId, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        notes: formData.notes.trim() || undefined,
      })

      setDefinition(response.data!.data)
      setEditingDef(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update definition')
    }
  }

  const handleToggleActive = async () => {
    if (!definition) return

    try {
      const response = await promptsApi.updateDefinition(definitionId, {
        is_active: !definition.is_active,
      })
      setDefinition(response.data!.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle active status')
    }
  }

  const handleVersionCreated = (newVersion: PromptVersion) => {
    setVersions([newVersion, ...versions])
    setShowNewVersionDialog(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!definition) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error || 'Prompt not found'}</p>
        </div>
      </div>
    )
  }

  const activeVersion = versions.find((v) => v.status === 'active')

  return (
    <div className="p-6 space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Definition Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-foreground">{definition.name}</h1>
            <Badge
              variant={definition.is_active ? 'default' : 'secondary'}
              className={
                definition.is_active
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-muted text-muted-foreground'
              }
            >
              {definition.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <code className="bg-muted text-muted-foreground px-2 py-1 rounded font-mono text-xs">
              {definition.slug}
            </code>
            <span className="text-muted-foreground">•</span>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              {definition.type.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
              {definition.role}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditingDef(!editingDef)}>
            {editingDef ? 'Cancel' : 'Edit'}
          </Button>
          <Button onClick={handleToggleActive} variant="outline">
            {definition.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      {editingDef && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Edit Definition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2 bg-muted/50 border-border"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-2 bg-muted/50 border-border min-h-20 resize-none"
              />
            </div>

            <div>
              <Label htmlFor="tags" className="text-sm font-medium">
                Tags
              </Label>
              <Input
                id="tags"
                placeholder="tag1, tag2, tag3"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="mt-2 bg-muted/50 border-border"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-2 bg-muted/50 border-border min-h-16 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditingDef(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleUpdateDefinition}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Version History */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Version History</CardTitle>
              <Button onClick={() => setShowNewVersionDialog(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-1 h-4 w-4" />
                New Version
              </Button>
            </CardHeader>
            <CardContent>
              {versions.length > 0 ? (
                <VersionHistoryTimeline
                  versions={versions}
                  onPreview={(version) => {
                    setPreviewVersion(version)
                    setShowPreviewDialog(true)
                  }}
                  onUpdated={loadData}
                />
              ) : (
                <p className="text-sm text-muted-foreground py-4">No versions yet. Create the first version.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Version Panel */}
        <div className="space-y-6">
          {activeVersion ? (
            <Card className="bg-emerald-50 border-emerald-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <CardTitle className="text-base">Active Version</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Version Number</p>
                  <p className="text-2xl font-semibold text-foreground mt-1">v{activeVersion.version_number}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm text-foreground mt-1">{new Date(activeVersion.created_at).toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Parsing Strategy</p>
                  <Badge variant="outline" className="mt-2">
                    {activeVersion.parsing_config.strategy.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-3">Variables ({activeVersion.variables.length})</p>
                  <div className="space-y-2">
                    {activeVersion.variables.length > 0 ? (
                      activeVersion.variables.map((v) => (
                        <div
                          key={v.name}
                          className="flex items-center justify-between bg-white/50 rounded px-2 py-1 text-xs"
                        >
                          <code className="font-mono text-xs text-foreground">{v.name}</code>
                          <Badge variant="secondary" className="text-[10px]">
                            {v.type}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No variables</p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setPreviewVersion(activeVersion)
                    setShowPreviewDialog(true)
                  }}
                  className="w-full mt-4"
                >
                  Preview
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-800 font-medium">No Active Version</p>
                <p className="text-xs text-amber-700 mt-2">Create and activate a version to use this prompt</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Version Dialog */}
      <VersionEditorDialog
        definitionId={definitionId}
        onCreated={handleVersionCreated}
        open={showNewVersionDialog}
        onOpenChange={setShowNewVersionDialog}
      />

      {/* Preview Dialog */}
      {previewVersion && (
        <VersionPreviewDialog
          version={previewVersion}
          open={showPreviewDialog}
          onOpenChange={setShowPreviewDialog}
        />
      )}
    </div>
  )
}
