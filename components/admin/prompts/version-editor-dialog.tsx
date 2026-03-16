'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react'
import type { PromptVersion, PromptVariable, PromptParsingConfig, PromptModelConfig } from '@/lib/api/admin'
import { promptsApi } from '@/lib/api/admin'
import { Checkbox } from '@/components/ui/checkbox'

interface Props {
  definitionId: string
  onCreated: (version: PromptVersion) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface VariableFormData {
  name: string
  type: PromptVariable['type']
  required: boolean
  description: string
  default_value: string
  filter: string
}

export function VersionEditorDialog({ definitionId, onCreated, open, onOpenChange }: Props) {
  const [template, setTemplate] = useState('')
  const [detectedVariables, setDetectedVariables] = useState<string[]>([])
  const [changeMessage, setChangeMessage] = useState('')

  const [variables, setVariables] = useState<VariableFormData[]>([])
  const [newVariable, setNewVariable] = useState<VariableFormData>({
    name: '',
    type: 'string',
    required: true,
    description: '',
    default_value: '',
    filter: '',
  })

  const [parsingStrategy, setParsingStrategy] = useState<PromptParsingConfig['strategy']>('plain_text')
  const [parsingJsonPath, setParsingJsonPath] = useState('')
  const [parsingRequiredKeys, setParsingRequiredKeys] = useState('')
  const [parsingPattern, setParsingPattern] = useState('')
  const [parsingCaptureGroup, setParsingCaptureGroup] = useState('0')
  const [parsingSchema, setParsingSchema] = useState('')
  const [parsingFallback, setParsingFallback] = useState('')

  const [preferredModel, setPreferredModel] = useState('')
  const [temperature, setTemperature] = useState('0.7')
  const [maxTokens, setMaxTokens] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    // Auto-detect variables from template
    const regex = /\{\{(\w+)[^}]*\}\}/g
    const matches = new Set<string>()
    let match

    while ((match = regex.exec(template)) !== null) {
      matches.add(match[1])
    }

    setDetectedVariables(Array.from(matches))
  }, [template, open])

  const handleAddVariable = () => {
    if (!newVariable.name.trim()) {
      setError('Variable name is required')
      return
    }

    if (variables.some((v) => v.name === newVariable.name)) {
      setError('Variable already exists')
      return
    }

    setVariables([...variables, newVariable])
    setNewVariable({
      name: '',
      type: 'string',
      required: true,
      description: '',
      default_value: '',
      filter: '',
    })
    setError(null)
  }

  const handleRemoveVariable = (name: string) => {
    setVariables(variables.filter((v) => v.name !== name))
  }

  const handleCreateVersion = async () => {
    if (!template.trim()) {
      setError('Template is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const variablesData = variables
        .filter((v) => v.name.trim())
        .map((v) => ({
          name: v.name.trim(),
          type: v.type,
          required: v.required,
          description: v.description.trim() || undefined,
          default_value: v.default_value.trim() || undefined,
          filter: v.filter.trim() || undefined,
        }))

      const parsingConfig: PromptParsingConfig = {
        strategy: parsingStrategy,
      }

      if (parsingStrategy === 'json_extract' && parsingJsonPath.trim()) {
        parsingConfig.json_path = parsingJsonPath.trim()
      }
      if (parsingStrategy === 'key_value' && parsingRequiredKeys.trim()) {
        parsingConfig.required_keys = parsingRequiredKeys
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0)
      }
      if (parsingStrategy === 'regex_extract' && parsingPattern.trim()) {
        parsingConfig.pattern = parsingPattern.trim()
        parsingConfig.capture_group = parseInt(parsingCaptureGroup, 10)
      }
      if (parsingStrategy === 'json_schema' && parsingSchema.trim()) {
        try {
          parsingConfig.schema = JSON.parse(parsingSchema)
        } catch {
          setError('Invalid JSON schema')
          return
        }
      }
      if (parsingFallback.trim()) {
        parsingConfig.fallback = parsingFallback.trim()
      }

      const modelConfig: PromptModelConfig | undefined =
        preferredModel.trim() || temperature !== '0.7' || maxTokens.trim()
          ? {
              preferred_model: preferredModel.trim() || undefined,
              temperature: temperature ? parseFloat(temperature) : undefined,
              max_tokens: maxTokens ? parseInt(maxTokens, 10) : undefined,
            }
          : undefined

      const response = await promptsApi.createVersion(definitionId, {
        template: template.trim(),
        variables: variablesData.length > 0 ? variablesData : undefined,
        parsing_config: parsingConfig,
        model_config: modelConfig,
        change_message: changeMessage.trim() || undefined,
      })

      onCreated(response.data!.data)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create version')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTemplate('')
    setDetectedVariables([])
    setChangeMessage('')
    setVariables([])
    setNewVariable({
      name: '',
      type: 'string',
      required: true,
      description: '',
      default_value: '',
      filter: '',
    })
    setParsingStrategy('plain_text')
    setParsingJsonPath('')
    setParsingRequiredKeys('')
    setParsingPattern('')
    setParsingCaptureGroup('0')
    setParsingSchema('')
    setParsingFallback('')
    setPreferredModel('')
    setTemperature('0.7')
    setMaxTokens('')
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Version</DialogTitle>
          <DialogDescription>Add a new draft version to your prompt definition</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Tabs defaultValue="template" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="parsing">Parsing</TabsTrigger>
            <TabsTrigger value="model">Model</TabsTrigger>
          </TabsList>

          {/* Template Tab */}
          <TabsContent value="template" className="space-y-4">
            <div>
              <Label htmlFor="template" className="text-sm font-medium">
                Template
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Use {'{{'} variable_name {'}'} for placeholders. Filters: {'{{'} items | json {'}'}, {'{{'} list | join
                {'}'}
              </p>
              <Textarea
                id="template"
                placeholder="Enter your prompt template..."
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="mt-2 font-mono text-sm resize-none w-full min-h-80 bg-muted/50 border-border rounded-md p-3"
              />
            </div>

            {detectedVariables.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Detected Variables</p>
                <div className="flex flex-wrap gap-2">
                  {detectedVariables.map((varName) => (
                    <Badge key={varName} variant="secondary">
                      {varName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="changeMessage" className="text-sm font-medium">
                Change Message
              </Label>
              <Input
                id="changeMessage"
                placeholder="What changed in this version?"
                value={changeMessage}
                onChange={(e) => setChangeMessage(e.target.value)}
                className="mt-2 bg-muted/50 border-border"
              />
            </div>
          </TabsContent>

          {/* Variables Tab */}
          <TabsContent value="variables" className="space-y-4">
            {variables.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Defined Variables</p>
                {variables.map((variable) => (
                  <div key={variable.name} className="border border-border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm text-foreground">{variable.name}</code>
                          <Badge variant="outline" className="text-xs">
                            {variable.type}
                          </Badge>
                          {variable.required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        {variable.description && (
                          <p className="text-xs text-muted-foreground mt-2">{variable.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVariable(variable.name)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
              <p className="text-sm font-medium text-foreground">Add Variable</p>

              <div>
                <Label htmlFor="varName" className="text-xs font-medium">
                  Name
                </Label>
                <Input
                  id="varName"
                  placeholder="variable_name"
                  value={newVariable.name}
                  onChange={(e) =>
                    setNewVariable({ ...newVariable, name: e.target.value.replace(/[^a-z0-9_]/gi, '_') })
                  }
                  className="mt-2 bg-white border-border text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="varType" className="text-xs font-medium">
                    Type
                  </Label>
                  <Select value={newVariable.type} onValueChange={(v: any) => setNewVariable({ ...newVariable, type: v })}>
                    <SelectTrigger id="varType" className="mt-2 bg-white border-border text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['string', 'number', 'boolean', 'string[]', 'object'] as const).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="varRequired"
                      checked={newVariable.required}
                      onCheckedChange={(v) => setNewVariable({ ...newVariable, required: v as boolean })}
                    />
                    <Label htmlFor="varRequired" className="text-xs font-medium cursor-pointer">
                      Required
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="varDesc" className="text-xs font-medium">
                  Description
                </Label>
                <Input
                  id="varDesc"
                  placeholder="What is this variable for?"
                  value={newVariable.description}
                  onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                  className="mt-2 bg-white border-border text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="varDefault" className="text-xs font-medium">
                    Default Value
                  </Label>
                  <Input
                    id="varDefault"
                    placeholder="Optional default"
                    value={newVariable.default_value}
                    onChange={(e) => setNewVariable({ ...newVariable, default_value: e.target.value })}
                    className="mt-2 bg-white border-border text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="varFilter" className="text-xs font-medium">
                    Filter
                  </Label>
                  <Input
                    id="varFilter"
                    placeholder="json, join, etc."
                    value={newVariable.filter}
                    onChange={(e) => setNewVariable({ ...newVariable, filter: e.target.value })}
                    className="mt-2 bg-white border-border text-sm"
                  />
                </div>
              </div>

              <Button onClick={handleAddVariable} className="w-full mt-2">
                <Plus className="mr-2 h-4 w-4" />
                Add Variable
              </Button>
            </div>
          </TabsContent>

          {/* Parsing Tab */}
          <TabsContent value="parsing" className="space-y-4">
            <div>
              <Label htmlFor="parsingStrategy" className="text-sm font-medium">
                Strategy
              </Label>
              <Select value={parsingStrategy} onValueChange={(v: any) => setParsingStrategy(v)}>
                <SelectTrigger id="parsingStrategy" className="mt-2 bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain_text">Plain Text</SelectItem>
                  <SelectItem value="json_extract">JSON Extract</SelectItem>
                  <SelectItem value="key_value">Key-Value</SelectItem>
                  <SelectItem value="regex_extract">Regex Extract</SelectItem>
                  <SelectItem value="json_schema">JSON Schema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {parsingStrategy === 'json_extract' && (
              <div>
                <Label htmlFor="jsonPath" className="text-sm font-medium">
                  JSON Path
                </Label>
                <Input
                  id="jsonPath"
                  placeholder="$.data[0].result"
                  value={parsingJsonPath}
                  onChange={(e) => setParsingJsonPath(e.target.value)}
                  className="mt-2 bg-muted/50 border-border"
                />
              </div>
            )}

            {parsingStrategy === 'key_value' && (
              <div>
                <Label htmlFor="requiredKeys" className="text-sm font-medium">
                  Required Keys (comma-separated)
                </Label>
                <Input
                  id="requiredKeys"
                  placeholder="key1, key2, key3"
                  value={parsingRequiredKeys}
                  onChange={(e) => setParsingRequiredKeys(e.target.value)}
                  className="mt-2 bg-muted/50 border-border"
                />
              </div>
            )}

            {parsingStrategy === 'regex_extract' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="pattern" className="text-sm font-medium">
                    Pattern
                  </Label>
                  <Input
                    id="pattern"
                    placeholder="(?:.*?)value[:\s]*([^,}]+)"
                    value={parsingPattern}
                    onChange={(e) => setParsingPattern(e.target.value)}
                    className="mt-2 font-mono text-xs bg-muted/50 border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="captureGroup" className="text-sm font-medium">
                    Capture Group
                  </Label>
                  <Input
                    id="captureGroup"
                    type="number"
                    min="0"
                    value={parsingCaptureGroup}
                    onChange={(e) => setParsingCaptureGroup(e.target.value)}
                    className="mt-2 bg-muted/50 border-border"
                  />
                </div>
              </div>
            )}

            {parsingStrategy === 'json_schema' && (
              <div>
                <Label htmlFor="schema" className="text-sm font-medium">
                  JSON Schema
                </Label>
                <Textarea
                  id="schema"
                  placeholder='{&#10;  "type": "object",&#10;  "properties": {...}&#10;}'
                  value={parsingSchema}
                  onChange={(e) => setParsingSchema(e.target.value)}
                  className="mt-2 font-mono text-xs resize-none min-h-32 bg-muted/50 border-border rounded-md p-3"
                />
              </div>
            )}

            <div>
              <Label htmlFor="fallback" className="text-sm font-medium">
                Fallback Value (optional)
              </Label>
              <Input
                id="fallback"
                placeholder="Value to use if parsing fails"
                value={parsingFallback}
                onChange={(e) => setParsingFallback(e.target.value)}
                className="mt-2 bg-muted/50 border-border"
              />
            </div>
          </TabsContent>

          {/* Model Config Tab */}
          <TabsContent value="model" className="space-y-4">
            <p className="text-xs text-muted-foreground">Optional — leave blank to use service defaults</p>

            <div>
              <Label htmlFor="preferredModel" className="text-sm font-medium">
                Preferred Model
              </Label>
              <Input
                id="preferredModel"
                placeholder="gpt-4, claude-3-opus, etc."
                value={preferredModel}
                onChange={(e) => setPreferredModel(e.target.value)}
                className="mt-2 bg-muted/50 border-border"
              />
            </div>

            <div>
              <Label htmlFor="temperature" className="text-sm font-medium flex items-center justify-between">
                Temperature
                <span className="text-xs text-muted-foreground font-normal">{temperature}</span>
              </Label>
              <Input
                id="temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">0 = deterministic, 2 = maximum randomness</p>
            </div>

            <div>
              <Label htmlFor="maxTokens" className="text-sm font-medium">
                Max Tokens
              </Label>
              <Input
                id="maxTokens"
                type="number"
                placeholder="4096"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                className="mt-2 bg-muted/50 border-border"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleCreateVersion}
            disabled={loading || !template.trim()}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create Draft Version'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
