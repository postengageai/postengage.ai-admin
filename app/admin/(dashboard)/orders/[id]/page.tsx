'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ordersApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ShoppingCart, CreditCard, FileText } from 'lucide-react'

const safeFormat = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await ordersApi.getById(orderId)
        const data = (res.data as any)?.data
        if (data) setOrder(data)
        else setError('Order not found')
      } catch (err) {
        setError('Failed to load order')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId])

  if (loading) return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>

  if (error || !order) {
    return (
      <div>
        <AdminPageHeader title="Order" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error || 'Not found'}</div>
      </div>
    )
  }

  const items = Array.isArray(order.items) ? order.items : []

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Order ${order.order_number || order._id?.slice(-8) || ''}`}
        description={`ID: ${order._id}`}
        action={
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/orders')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1"><StatusBadge status={order.status || 'pending'} /></div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Currency</Label>
                <div className="mt-1"><Badge variant="outline">{order.currency || 'USD'}</Badge></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <p className="text-lg font-bold mt-1">
                  {order.amount != null ? `$${Number(order.amount).toFixed(2)}` : '—'}
                </p>
              </div>
              {order.discount != null && order.discount !== 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Discount</Label>
                  <p className="text-sm mt-1 text-green-600">-${Number(order.discount).toFixed(2)}</p>
                </div>
              )}
            </div>
            {order.user_id && (
              <div>
                <Label className="text-xs text-muted-foreground">User</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/users/${order.user_id}`)}
                >
                  {order.user_id}
                </p>
              </div>
            )}
            {order.payment_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Payment ID</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/payments/${order.payment_id}`)}
                >
                  {order.payment_id}
                </p>
              </div>
            )}
            {order.invoice_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Invoice ID</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/invoices/${order.invoice_id}`)}
                >
                  {order.invoice_id}
                </p>
              </div>
            )}
            {order.notes && (
              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <p className="text-sm mt-1 text-muted-foreground">{order.notes}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">{safeFormat(order.created_at)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Updated</Label>
                <p className="text-sm mt-1">{safeFormat(order.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Order Items {items.length > 0 && <Badge variant="secondary">{items.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items</p>
            ) : (
              <div className="space-y-2">
                {items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-start py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.name || item.product_name || item.package_name || `Item ${i + 1}`}</p>
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      {item.quantity && item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {item.price != null && (
                        <p className="text-sm font-medium">${Number(item.price).toFixed(2)}</p>
                      )}
                      {item.credits && (
                        <Badge variant="outline" className="text-xs">{item.credits} credits</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Metadata */}
            {order.metadata && Object.keys(order.metadata).length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Label className="text-xs text-muted-foreground mb-2 block">Metadata</Label>
                <div className="space-y-1">
                  {Object.entries(order.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="font-mono">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
