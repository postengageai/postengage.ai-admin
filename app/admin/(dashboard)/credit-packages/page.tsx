'use client'
import { useState, useEffect } from 'react'
import { creditPackagesApi, AdminCreditPackage, currenciesApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { PaginationControls } from '@/components/admin/pagination-controls'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Edit2, Trash2 } from 'lucide-react'

interface PackageForm {
  name: string
  credit_amount: string
  price: string
  currency: string
  description: string
}

const emptyForm: PackageForm = {
  name: '',
  credit_amount: '',
  price: '',
  currency: 'USD',
  description: '',
}

export default function CreditPackagesPage() {
  const [packages, setPackages] = useState<AdminCreditPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })
  const [togglingId, setTogglingId] = useState<string | null>(null)
  // Currency lookup: { [_id]: { code, symbol, name } }
  const [currencyMap, setCurrencyMap] = useState<Record<string, { code?: string; symbol?: string; name?: string }>>({})
  const [currencies, setCurrencies] = useState<any[]>([])

  // Dialog states
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingPkg, setEditingPkg] = useState<AdminCreditPackage | null>(null)
  const [deletingPkg, setDeletingPkg] = useState<AdminCreditPackage | null>(null)
  const [form, setForm] = useState<PackageForm>(emptyForm)
  const [formSaving, setFormSaving] = useState(false)
  const [formDeleting, setFormDeleting] = useState(false)

  useEffect(() => {
    loadPackages()
    loadCurrencies()
  }, [page])

  const loadCurrencies = async () => {
    try {
      const res = await currenciesApi.list()
      const list = (res.data as any)?.data ?? []
      setCurrencies(list)
      const map: Record<string, any> = {}
      list.forEach((c: any) => {
        if (c._id) map[c._id] = c
      })
      setCurrencyMap(map)
    } catch {
      // silent — currency map is optional enhancement
    }
  }

  const loadPackages = async () => {
    try {
      setLoading(true)
      const response = await creditPackagesApi.list()
      if (response.data) {
        setPackages(response.data.data ?? [])
        const pag = response.data.pagination
        setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
      }
    } catch (err) {
      setError('Failed to load credit packages')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isPackageActive = (pkg: AdminCreditPackage): boolean =>
    pkg.is_active ?? pkg.status === 'active'

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      setTogglingId(id)
      await creditPackagesApi.update(id, { status: currentActive ? 'inactive' : 'active' })
      setPackages(packages.map(pkg =>
        pkg._id === id ? { ...pkg, status: currentActive ? 'inactive' : 'active', is_active: !currentActive } : pkg
      ))
    } catch (err) {
      console.error('Failed to toggle package active status', err)
    } finally {
      setTogglingId(null)
    }
  }

  const openCreateDialog = () => {
    setEditingPkg(null)
    setForm(emptyForm)
    setShowFormDialog(true)
  }

  const openEditDialog = (pkg: AdminCreditPackage) => {
    setEditingPkg(pkg)
    setForm({
      name: pkg.name,
      credit_amount: String(pkg.credit_amount ?? pkg.credits ?? ''),
      price: String(pkg.price ?? ''),
      currency: pkg.currency ?? pkg.currency_id ?? 'USD',
      description: pkg.description ?? '',
    })
    setShowFormDialog(true)
  }

  const openDeleteDialog = (pkg: AdminCreditPackage) => {
    setDeletingPkg(pkg)
    setShowDeleteDialog(true)
  }

  const handleFormSave = async () => {
    if (!form.name || !form.credit_amount || !form.price) return
    try {
      setFormSaving(true)
      const payload: Partial<AdminCreditPackage> = {
        name: form.name,
        credit_amount: parseInt(form.credit_amount),
        price: parseFloat(form.price),
        currency: form.currency,
        description: form.description || undefined,
      }
      if (editingPkg) {
        await creditPackagesApi.update(editingPkg._id, payload)
      } else {
        await creditPackagesApi.create({ ...payload, status: 'active' })
      }
      setShowFormDialog(false)
      await loadPackages()
    } catch (err) {
      console.error('Failed to save package', err)
    } finally {
      setFormSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingPkg) return
    try {
      setFormDeleting(true)
      await creditPackagesApi.delete(deletingPkg._id)
      setShowDeleteDialog(false)
      await loadPackages()
    } catch (err) {
      console.error('Failed to delete package', err)
    } finally {
      setFormDeleting(false)
    }
  }

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Credit Packages" description="Manage credit packages" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="Credit Packages"
        description="Manage credit packages and pricing"
        action={
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Create Package
          </Button>
        }
      />

      {loading ? (
        <div className="text-muted-foreground text-sm p-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No credit packages found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  packages.map((pkg) => {
                    const active = isPackageActive(pkg)
                    const credits = pkg.credit_amount ?? pkg.credits ?? 0
                    // Resolve currency: prefer direct name, else look up by ID in map
                    const resolvedCurrency = pkg.currency
                      ?? (pkg.currency_id ? (currencyMap[pkg.currency_id]?.code ?? currencyMap[pkg.currency_id]?.symbol ?? currencyMap[pkg.currency_id]?.name ?? pkg.currency_id.slice(-6)) : '—')
                    return (
                      <TableRow key={pkg._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pkg.name}</p>
                            {pkg.description && (
                              <p className="text-xs text-muted-foreground">{pkg.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{credits.toLocaleString()}</TableCell>
                        <TableCell>${(pkg.price ?? 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <span title={pkg.currency_id}>{resolvedCurrency}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={active ? 'default' : 'secondary'}>
                            {active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(pkg)}
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(pkg._id, active)}
                              disabled={togglingId === pkg._id}
                            >
                              {active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(pkg)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} packages</p>
            <PaginationControls
              page={page}
              totalPages={pagination.total_pages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPkg ? 'Edit Package' : 'Create Package'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Package Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Starter Pack"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Credits *</Label>
                <Input
                  type="number"
                  value={form.credit_amount}
                  onChange={(e) => setForm({ ...form, credit_amount: e.target.value })}
                  placeholder="e.g. 1000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Price (USD) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g. 9.99"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Currency</Label>
              {currencies.length > 0 ? (
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">Select currency</option>
                  {currencies.map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.code || c.symbol || c.name || c._id}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  placeholder="USD"
                  className="mt-1"
                />
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFormSave}
              disabled={formSaving || !form.name || !form.credit_amount || !form.price}
            >
              {formSaving ? 'Saving...' : editingPkg ? 'Save Changes' : 'Create Package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Package</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deletingPkg?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={formDeleting}>
              {formDeleting ? 'Deleting...' : 'Delete Package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
