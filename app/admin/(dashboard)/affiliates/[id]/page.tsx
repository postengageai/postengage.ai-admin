'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { affiliatesApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Handshake, DollarSign, Users } from 'lucide-react'

const safeFormat = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

export default function AffiliateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const affiliateId = params.id as string

  const [affiliate, setAffiliate] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await affiliatesApi.getById(affiliateId)
        const data = (res.data as any)?.data
        if (data) setAffiliate(data)
        else setError('Affiliate not found')
      } catch (err) {
        setError('Failed to load affiliate')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [affiliateId])

  if (loading) return <div className="p-8 text-muted-foreground text-sm text-center">Loading...</div>

  if (error || !affiliate) {
    return (
      <div>
        <AdminPageHeader title="Affiliate" description="" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error || 'Not found'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Affiliate ${affiliate.code || affiliate._id?.slice(-8)}`}
        description={`ID: ${affiliate._id}`}
        action={
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/affiliates')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Commission Rate</p>
            <p className="text-2xl font-bold mt-1 text-primary">
              {affiliate.commission_rate != null ? `${affiliate.commission_rate}%` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Earnings</p>
            <p className="text-2xl font-bold mt-1 text-green-600">
              {affiliate.total_earnings != null ? `$${Number(affiliate.total_earnings).toFixed(2)}` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Referrals</p>
            <p className="text-2xl font-bold mt-1">
              {affiliate.total_referrals ?? affiliate.referral_count ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Pending Payout</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">
              {affiliate.pending_payout != null ? `$${Number(affiliate.pending_payout).toFixed(2)}` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Affiliate Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Handshake className="h-4 w-4" />
              Affiliate Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1"><StatusBadge status={affiliate.status || 'active'} /></div>
              </div>
              {affiliate.code && (
                <div>
                  <Label className="text-xs text-muted-foreground">Referral Code</Label>
                  <div className="mt-1">
                    <Badge variant="secondary" className="font-mono text-sm">{affiliate.code}</Badge>
                  </div>
                </div>
              )}
            </div>
            {affiliate.user_id && (
              <div>
                <Label className="text-xs text-muted-foreground">User</Label>
                <p
                  className="text-sm font-mono text-primary cursor-pointer hover:underline mt-1"
                  onClick={() => router.push(`/admin/users/${affiliate.user_id}`)}
                >
                  {affiliate.user_id}
                </p>
              </div>
            )}
            {affiliate.payout_method && (
              <div>
                <Label className="text-xs text-muted-foreground">Payout Method</Label>
                <p className="text-sm mt-1 capitalize">{affiliate.payout_method}</p>
              </div>
            )}
            {affiliate.payout_details && (
              <div>
                <Label className="text-xs text-muted-foreground">Payout Details</Label>
                <p className="text-sm font-mono mt-1">{typeof affiliate.payout_details === 'object' ? JSON.stringify(affiliate.payout_details) : affiliate.payout_details}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Joined</Label>
                <p className="text-sm mt-1">{safeFormat(affiliate.created_at)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Updated</Label>
                <p className="text-sm mt-1">{safeFormat(affiliate.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Earnings & Payouts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ['Total Earned', affiliate.total_earnings, 'text-green-600'],
              ['Total Paid Out', affiliate.total_paid, 'text-blue-600'],
              ['Pending Payout', affiliate.pending_payout, 'text-amber-600'],
            ].map(([label, val, cls]) => val != null && (
              <div key={label as string} className="flex justify-between items-center py-1.5 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={`text-sm font-semibold ${cls}`}>
                  ${Number(val).toFixed(2)}
                </span>
              </div>
            ))}
            {affiliate.last_payout_at && (
              <div className="pt-2">
                <Label className="text-xs text-muted-foreground">Last Payout</Label>
                <p className="text-sm mt-1">{safeFormat(affiliate.last_payout_at)}</p>
              </div>
            )}
            {affiliate.notes && (
              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <p className="text-sm mt-1 text-muted-foreground">{affiliate.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
