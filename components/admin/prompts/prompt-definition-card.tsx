'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ChevronRight, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { PromptDefinition } from '@/lib/api/admin'
import { promptsApi } from '@/lib/api/admin'

interface Props {
  definition: PromptDefinition
  onUpdated: () => void
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  intent_classification: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  response_generation: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  voice_dna_analysis: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  few_shot_curation: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  entity_extraction: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  bot_simulation: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  content_moderation: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  custom: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  system: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  user: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  combined: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
}

export function PromptDefinitionCard({ definition, onUpdated }: Props) {
  const [togglingActive, setTogglingActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const typeColors = TYPE_COLORS[definition.type] || TYPE_COLORS.custom
  const roleColors = ROLE_COLORS[definition.role] || ROLE_COLORS.system

  const handleToggleActive = async (checked: boolean) => {
    try {
      setTogglingActive(true)
      setError(null)
      await promptsApi.updateDefinition(definition._id, {
        is_active: checked,
      })
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setTogglingActive(false)
    }
  }

  return (
    <Link href={`/admin/prompts/${definition._id}`}>
      <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground truncate flex-1">{definition.name}</h3>
              <Switch
                checked={definition.is_active}
                onCheckedChange={handleToggleActive}
                disabled={togglingActive}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <code className="inline-block font-mono text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
              {definition.slug}
            </code>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4">
          {/* Description */}
          {definition.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{definition.description}</p>
          )}

          {/* Type & Role Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={`${typeColors.bg} ${typeColors.text} ${typeColors.border} text-xs`}>
              {definition.type.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="outline" className={`${roleColors.bg} ${roleColors.text} ${roleColors.border} text-xs`}>
              {definition.role}
            </Badge>
          </div>

          {/* Tags */}
          {definition.tags && definition.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {definition.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {definition.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{definition.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Active Version Info */}
          <div className="pt-2 border-t border-border">
            {definition.active_version_id ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span className="text-sm text-foreground font-medium">
                    v{definition.latest_version_number} active
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-sm text-amber-700 font-medium">No active version</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              Latest: v{definition.latest_version_number}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {error}
            </div>
          )}

          {/* Loading indicator */}
          {togglingActive && (
            <div className="flex items-center justify-center py-1">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>

        {/* Footer with link indicator */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">View details</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
    </Link>
  )
}
