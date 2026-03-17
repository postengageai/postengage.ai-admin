'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { paymentsApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CreditCard } from 'lucide-react'

const safeFormat = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export default function PaymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const paymentId = params.id as string

  const [payment, setPayment] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await paymentsApi.getById(paymentId)
        const data = (res.data as any)?.data
        if (data) setPayment(data)
        else setError('Payment not found')
      } catch (err) {
        setError('Failed to load payment')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [paymentId])

  if (loading) return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>

  if (error || !payment) {
    return (
      <div>
        <AdminPageHeader title="Payment" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error || 'Not found'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Payment ${payment._id?.slice(-8) || ''}`}
        description={`ID: ${payment._id}`}
        action={
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/payments')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1"><StatusBadge status={payment.status || 'pending'} /></div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Provider</Label>
                <div className="mt-1">
                  {payment.provider ? (
                    <Badge variant="secondary" className="capitalize">{payment.provider}</Badge>
                  ) : <span className="text-sm">—</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <p className="text-2xl font-bold mt-1">
                  ${Number(payment.amount || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Currency</Label>
                <div className="mt-1">
                  <Badge variant="outline">{payment.currency || 'USD'}</Badge>
                </div>
              </div>
            </div>
            {payment.user_id && (
              <div>
                <Label className="text-xs text-muted-foreground">User</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/users/${payment.user_id}`)}
                >
                  {payment.user_id}
                </p>
              </div>
            )}
            {payment.order_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Order</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/orders/${payment.order_id}`)}
                >
                  {payment.order_id}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">{safeFormat(payment.created_at)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Updated</Label>
                <p className="text-sm mt-1">{safeFormat(payment.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payment.transaction_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Transaction ID</Label>
                <p className="text-sm font-mono mt-1 break-all">{payment.transaction_id}</p>
              </div>
            )}
            {payment.provider_payment_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Provider Payment ID</Label>
                <p className="text-sm font-mono mt-1 break-all">{payment.provider_payment_id}</p>
              </div>
            )}
            {payment.provider_customer_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Provider Customer ID</Label>
                <p className="text-sm font-mono mt-1 break-all">{payment.provider_customer_id}</p>
              </div>
            )}
            {payment.failure_reason && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <Label className="text-xs text-destructive">Failure Reason</Label>
                <p className="text-sm mt-1 text-destructive">{payment.failure_reason}</p>
              </div>
            )}
            {payment.refund_reason && (
              <div>
                <Label className="text-xs text-muted-foreground">Refund Reason</Label>
                <p className="text-sm mt-1">{payment.refund_reason}</p>
              </div>
            )}
            {payment.metadata && Object.keys(payment.metadata).length > 0 && (
              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground mb-2 block">Metadata</Label>
                <div className="space-y-1">
                  {Object.entries(payment.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="font-mono">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!payment.transaction_id && !payment.provider_payment_id && !payment.failure_reason && (
              <p className="text-sm text-muted-foreground">No additional transaction details</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
