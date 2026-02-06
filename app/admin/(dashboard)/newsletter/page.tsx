'use client'

import { useState, useEffect, useCallback } from 'react'
import { newsletterApi } from '@/lib/api/newsletter'
import { NewsletterSubscriber } from '@/lib/types'
import { DataTable } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function NewsletterPage() {
  const { toast } = useToast()
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSubscribers = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await newsletterApi.getSubscribers({ limit: 100 })
      setSubscribers(response.items)
    } catch (error) {
      console.error('Failed to fetch subscribers:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch subscribers. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  const columns = [
    {
      key: 'email',
      header: 'Email',
      cell: (subscriber: NewsletterSubscriber) => (
        <span className="font-medium">{subscriber.email}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (subscriber: NewsletterSubscriber) => (
         <Badge variant={subscriber.is_active ? 'default' : 'secondary'}>
           {subscriber.is_active ? 'Active' : 'Unsubscribed'}
         </Badge>
      )
    },
    {
      key: 'created_at',
      header: 'Subscribed On',
      cell: (subscriber: NewsletterSubscriber) => formatDate(subscriber.created_at)
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Newsletter Subscribers</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscribers List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={subscribers}
            columns={columns}
            searchKey="email"
          />
        </CardContent>
      </Card>
    </div>
  )
}
