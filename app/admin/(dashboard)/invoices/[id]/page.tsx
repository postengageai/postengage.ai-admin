'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { invoicesApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, FileText, DollarSign } from 'lucide-react'

const safeFormat = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await invoicesApi.getById(invoiceId)
        const data = (res.data as any)?.data
        if (data) setInvoice(data)
        else setError('Invoice not found')
      } catch (err) {
        setError('Failed to load invoice')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [invoiceId])

  if (loading) return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>

  if (error || !invoice) {
    return (
      <div>
        <AdminPageHeader title="Invoice" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error || 'Not found'}</div>
      </div>
    )
  }

  const items = Array.isArray(invoice.items) ? invoice.items : []

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Invoice ${invoice.invoice_number || invoice._id?.slice(-8) || ''}`}
        description={`ID: ${invoice._id}`}
        action={
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1"><StatusBadge status={invoice.status || 'draft'} /></div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <p className="text-lg font-bold mt-1">
                  {invoice.amount != null ? `$${Number(invoice.amount).toFixed(2)}` : '—'}
                </p>
              </div>
            </div>
            {invoice.user_id && (
              <div>
                <Label className="text-xs text-muted-foreground">User</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/users/${invoice.user_id}`)}
                >
                  {invoice.user_id}
                </p>
              </div>
            )}
            {invoice.order_id && (
              <div>
                <Label className="text-xs text-muted-foreground">Order</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/orders/${invoice.order_id}`)}
                >
                  {invoice.order_id}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <p className="text-sm mt-1">{safeFormat(invoice.due_date)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Paid At</Label>
                <p className="text-sm mt-1">{safeFormat(invoice.paid_at)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">{safeFormat(invoice.created_at)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Updated</Label>
                <p className="text-sm mt-1">{safeFormat(invoice.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Line Items {items.length > 0 && <Badge variant="secondary">{items.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No line items</p>
            ) : (
              <div className="space-y-2">
                {items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">
                        {item.name || item.description || item.package_name || `Item ${i + 1}`}
                      </p>
                      {item.quantity && item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {item.amount != null && (
                        <p className="text-sm font-medium">${Number(item.amount).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-semibold">
                  <span>Total</span>
                  <span>{invoice.amount != null ? `$${Number(invoice.amount).toFixed(2)}` : '—'}</span>
                </div>
              </div>
            )}

            {invoice.notes && (
              <div className="mt-4 pt-4 border-t">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <p className="text-sm mt-1 text-muted-foreground">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
