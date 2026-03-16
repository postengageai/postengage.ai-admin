'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { PromptVersion } from '@/lib/api/admin'
import { promptsApi } from '@/lib/api/admin'

interface Props {
  versions: PromptVersion[]
  onPreview: (version: PromptVersion) => void
  onUpdated: () => void
}

export function VersionHistoryTimeline({ versions, onPreview, onUpdated }: Props) {
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number)

  const handleActivate = async (versionId: string) => {
    try {
      setActionLoading(versionId)
      setError(null)
      await promptsApi.activateVersion(versionId)
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate version')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeprecate = async (versionId: string) => {
    try {
      setActionLoading(versionId)
      setError(null)
      await promptsApi.deprecateVersion(versionId)
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deprecate version')
    } finally {
      setActionLoading(null)
    }
  }

  const handleArchive = async (versionId: string) => {
    try {
      setActionLoading(versionId)
      setError(null)
      await promptsApi.archiveVersion(versionId)
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive version')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReActivate = async (versionId: string) => {
    try {
      setActionLoading(versionId)
      setError(null)
      await promptsApi.activateVersion(versionId)
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-activate version')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: PromptVersion['status']) => {
    switch (status) {
      case 'draft':
        return { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' }
      case 'active':
        return { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' }
      case 'deprecated':
        return { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800' }
      case 'archived':
        return { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-800' }
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 mb-4">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {sortedVersions.map((version, index) => {
        const isExpanded = expandedVersionId === version._id
        const colors = getStatusColor(version.status)
        const isLoading = actionLoading === version._id

        return (
          <div key={version._id} className="relative">
            {/* Timeline dot and line */}
            <div className="absolute -left-6 top-0 flex flex-col items-center">
              <div
                className={`h-3 w-3 rounded-full border-2 border-background ${
                  version.status === 'active' ? 'bg-emerald-600' : 'bg-muted'
                }`}
              />
              {index < sortedVersions.length - 1 && <div className="w-0.5 h-12 bg-border mt-3" />}
            </div>

            {/* Version Card */}
            <div className={`border rounded-lg p-4 pl-6 ${colors.border} ${colors.bg}`}>
              <button
                onClick={() => setExpandedVersionId(isExpanded ? null : version._id)}
                className="w-full text-left flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-sm font-semibold">
                      v{version.version_number}
                    </Badge>
                    <Badge className={colors.badge}>{version.status}</Badge>
                    {version.status === 'active' && (
                      <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                    )}
                  </div>

                  {version.change_message && (
                    <p className="text-sm text-foreground mt-2">{version.change_message}</p>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(version.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="ml-4 shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-4">
                  {/* Template Preview */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Template</p>
                    <div className="bg-white/50 border border-current border-opacity-10 rounded px-3 py-2 max-h-32 overflow-auto">
                      <pre className="font-mono text-xs text-foreground whitespace-pre-wrap break-words">
                        {version.template.substring(0, 300)}
                        {version.template.length > 300 ? '...' : ''}
                      </pre>
                    </div>
                  </div>

                  {/* Parsing Strategy */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Parsing Strategy</p>
                    <Badge variant="outline">{version.parsing_config.strategy.replace(/_/g, ' ')}</Badge>
                  </div>

                  {/* Variables */}
                  {version.variables.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Variables ({version.variables.length})
                      </p>
                      <div className="grid gap-2">
                        {version.variables.map((v) => (
                          <div
                            key={v.name}
                            className="flex items-center justify-between bg-white/50 rounded px-2 py-1.5 text-xs"
                          >
                            <code className="font-mono text-xs text-foreground">{v.name}</code>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px]">
                                {v.type}
                              </Badge>
                              {v.required && (
                                <Badge variant="secondary" className="text-[10px]">
                                  required
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Model Config */}
                  {version.model_config && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Model Config</p>
                      <div className="bg-white/50 rounded px-3 py-2 text-xs space-y-1">
                        {version.model_config.preferred_model && (
                          <p>
                            <span className="text-muted-foreground">Model:</span> {version.model_config.preferred_model}
                          </p>
                        )}
                        {version.model_config.temperature !== undefined && (
                          <p>
                            <span className="text-muted-foreground">Temperature:</span>{' '}
                            {version.model_config.temperature}
                          </p>
                        )}
                        {version.model_config.max_tokens && (
                          <p>
                            <span className="text-muted-foreground">Max Tokens:</span>{' '}
                            {version.model_config.max_tokens}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {version.status === 'draft' && (
                      <>
                        <Button
                          onClick={() => handleActivate(version._id)}
                          disabled={isLoading}
                          size="sm"
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          {isLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          Activate
                        </Button>
                        <Button
                          onClick={() => onPreview(version)}
                          disabled={isLoading}
                          size="sm"
                          variant="outline"
                        >
                          Preview
                        </Button>
                      </>
                    )}

                    {version.status === 'active' && (
                      <>
                        <Button
                          onClick={() => onPreview(version)}
                          disabled={isLoading}
                          size="sm"
                          variant="outline"
                        >
                          Preview
                        </Button>
                        <Button
                          onClick={() => handleDeprecate(version._id)}
                          disabled={isLoading}
                          size="sm"
                          variant="outline"
                          className="border-orange-200 text-orange-700 hover:bg-orange-50"
                        >
                          {isLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          Deprecate
                        </Button>
                      </>
                    )}

                    {version.status === 'deprecated' && (
                      <>
                        <Button
                          onClick={() => handleArchive(version._id)}
                          disabled={isLoading}
                          size="sm"
                          variant="outline"
                          className="border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          {isLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          Archive
                        </Button>
                        <Button
                          onClick={() => handleReActivate(version._id)}
                          disabled={isLoading}
                          size="sm"
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          {isLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          Re-activate
                        </Button>
                      </>
                    )}

                    {version.status === 'archived' && (
                      <span className="text-xs text-muted-foreground py-2">Archived versions cannot be modified</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
