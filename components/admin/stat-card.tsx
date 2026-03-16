'use client'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface Props {
  title: string
  value: ReactNode
  change?: number
  icon?: LucideIcon
  description?: string
}

export function StatCard({ title, value, change, icon: Icon, description }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold mt-2">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
            {change !== undefined && (
              <p className={`text-xs mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change}%
              </p>
            )}
          </div>
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  )
}
