'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Copy, Loader2 } from 'lucide-react'
import type { PromptVersion } from '@/lib/api/admin'
import { promptsApi } from '@/lib/api/admin'

interface Props {
  version: PromptVersion
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VersionPreviewDialog({ version, open, onOpenChange }: Props) {
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({})
  const [previewResult, setPreviewResult] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const [parseInput, setParseInput] = useState('')
  const [parseResult, setParseResult] = useState<unknown | null>(null)
  const [parseLoading, setParseLoading] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handlePreview = async () => {
    try {
      setPreviewLoading(true)
      setPreviewError(null)

      const result = await promptsApi.previewVersion(version._id, previewVariables)
      setPreviewResult(result.data!.data.text)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to render preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleTestParse = async () => {
    if (!parseInput.trim()) {
      setParseError('Enter raw response to test')
      return
    }

    try {
      setParseLoading(true)
      setParseError(null)

      const result = await promptsApi.testParse(version._id, parseInput)
      setParseResult(result.data!.data)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Parsing failed')
    } finally {
      setParseLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Version v{version.version_number}</DialogTitle>
          <DialogDescription>Test and preview this prompt version</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="parse">Parse Test</TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            {version.variables.length > 0 ? (
              <>
                <p className="text-sm font-medium text-foreground">Enter Variable Values</p>

                <div className="space-y-3 bg-muted/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {version.variables.map((variable) => (
                    <div key={variable.name}>
                      <Label htmlFor={`var-${variable.name}`} className="text-xs font-medium">
                        {variable.name}
                        {variable.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <Input
                        id={`var-${variable.name}`}
                        type={variable.type === 'number' ? 'number' : 'text'}
                        placeholder={variable.default_value || `Enter ${variable.type}`}
                        value={previewVariables[variable.name] || ''}
                        onChange={(e) =>
                          setPreviewVariables({
                            ...previewVariables,
                            [variable.name]: e.target.value,
                          })
                        }
                        className="mt-1.5 bg-white border-border text-sm"
                      />
                      {variable.description && (
                        <p className="text-xs text-muted-foreground mt-1">{variable.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">This template has no variables</p>
            )}

            <Button
              onClick={handlePreview}
              disabled={previewLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {previewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {previewLoading ? 'Rendering...' : 'Render Template'}
            </Button>

            {previewError && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{previewError}</p>
              </div>
            )}

            {previewResult && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">Rendered Output</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(previewResult)}
                    className="h-7 text-xs"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    {copiedText === previewResult ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4 overflow-auto max-h-96">
                  <pre className="font-mono text-xs text-foreground whitespace-pre-wrap break-words">{previewResult}</pre>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Parse Test Tab */}
          <TabsContent value="parse" className="space-y-4">
            <div>
              <Label htmlFor="rawResponse" className="text-sm font-medium">
                Raw LLM Response
              </Label>
              <Textarea
                id="rawResponse"
                placeholder="Paste the raw response from your LLM here to test the parsing strategy..."
                value={parseInput}
                onChange={(e) => setParseInput(e.target.value)}
                className="mt-2 font-mono text-xs resize-none min-h-32 bg-muted/50 border-border rounded-md p-3"
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">
                <strong>Parsing Strategy:</strong> {version.parsing_config.strategy.replace(/_/g, ' ')}
              </p>
              {version.parsing_config.json_path && (
                <p className="text-xs text-muted-foreground">
                  <strong>JSON Path:</strong> {version.parsing_config.json_path}
                </p>
              )}
              {version.parsing_config.pattern && (
                <p className="text-xs text-muted-foreground break-all">
                  <strong>Pattern:</strong> {version.parsing_config.pattern}
                </p>
              )}
              {version.parsing_config.required_keys && version.parsing_config.required_keys.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  <strong>Required Keys:</strong> {version.parsing_config.required_keys.join(', ')}
                </p>
              )}
            </div>

            <Button
              onClick={handleTestParse}
              disabled={parseLoading || !parseInput.trim()}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {parseLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {parseLoading ? 'Testing...' : 'Test Parsing'}
            </Button>

            {parseError && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{parseError}</p>
              </div>
            )}

            {parseResult !== null && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">Parsed Result</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(JSON.stringify(parseResult, null, 2))}
                    className="h-7 text-xs"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    {copiedText === JSON.stringify(parseResult) ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4 overflow-auto max-h-96">
                  <pre className="font-mono text-xs text-foreground whitespace-pre-wrap break-words">
                    {JSON.stringify(parseResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="pt-4">
          <Button onClick={() => onOpenChange(false)} className="w-full" variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
