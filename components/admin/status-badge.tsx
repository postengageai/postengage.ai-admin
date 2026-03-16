'use client'
import { Badge } from '@/components/ui/badge'

interface Props {
  status: string
}

export function StatusBadge({ status }: Props) {
  const normalizedStatus = status?.toLowerCase() || 'unknown'

  // Determine variant based on status
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default'

  if (['active', 'operational', 'completed', 'success'].includes(normalizedStatus)) {
    variant = 'default'
  } else if (['draft', 'pending', 'inactive'].includes(normalizedStatus)) {
    variant = 'secondary'
  } else if (['deprecated', 'paused'].includes(normalizedStatus)) {
    variant = 'outline'
  } else if (['archived', 'deleted', 'failed'].includes(normalizedStatus)) {
    variant = 'destructive'
  } else {
    variant = 'secondary'
  }

  return <Badge variant={variant}>{status}</Badge>
}
