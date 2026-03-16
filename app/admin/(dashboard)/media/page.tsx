'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { mediaApi } from '@/lib/api/admin'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function MediaPage() {
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 })

  useEffect(() => {
    const loadMedia = async () => {
      try {
        setLoading(true)
        const response = await mediaApi.list({ page: page + 1, limit: 10 })
        if (response.data) {
          setMedia(response.data.data.data ?? [])
          const pag = response.data.data.pagination
          setPagination({ total: pag?.total ?? 0, total_pages: pag?.total_pages ?? 1 })
        }
      } catch (err) {
        setError('Failed to load media')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadMedia()
  }, [page])

  const isImageFile = (url: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const ext = url?.split('.').pop()?.toLowerCase()
    return ext && imageExtensions.includes(ext)
  }

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Media" description="Manage uploaded media files" />
        <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Media" description="Manage uploaded media files and assets" />

      {loading ? (
        <div className="text-muted-foreground text-sm p-4 text-center">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {media.map((file) => (
                  <TableRow key={file._id || file.id}>
                    <TableCell className="font-medium truncate max-w-xs">{file.filename || file.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.type || 'unknown'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {file.size ? `${(file.size / 1024).toFixed(2)} KB` : '-'}
                    </TableCell>
                    <TableCell className="text-sm">{file.uploaded_by || '-'}</TableCell>
                    <TableCell>
                      {file.url && isImageFile(file.url) ? (
                        <img src={file.url} alt="preview" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {file.created_at ? format(new Date(file.created_at), 'MMM d, yyyy') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total: {pagination.total} files</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground px-3 py-1">
                Page {page + 1} of {pagination.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.total_pages - 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
