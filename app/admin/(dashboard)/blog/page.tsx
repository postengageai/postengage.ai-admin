'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { blogApi } from '@/lib/api/blog'
import { BlogPost } from '@/lib/types'
import { DataTable } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { 
  MoreHorizontal, 
  Edit,
  Trash2,
  Plus,
  ExternalLink,
  EyeIcon,
  FilePenLine,
  FileCheck,
  Loader2,
} from 'lucide-react'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatusBadge(status: BlogPost['status']) {
  switch (status) {
    case 'PUBLISHED':
      return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Published</Badge>
    case 'DRAFT':
      return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">Draft</Badge>
    case 'ARCHIVED':
      return <Badge variant="secondary">Archived</Badge>
  }
}

export default function BlogPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await blogApi.getPosts({ limit: 100 })
      setPosts(response.items)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch blog posts. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleDeleteClick = (post: BlogPost) => {
    setSelectedPost(post)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedPost) return

    try {
      setIsSaving(true)
      await blogApi.deletePost(selectedPost._id)
      
      setPosts(posts.filter(p => p._id !== selectedPost._id))
      
      toast({
        title: 'Post deleted',
        description: 'The blog post has been successfully deleted.',
      })
      
      setIsDeleteOpen(false)
      setSelectedPost(null)
    } catch (error) {
      console.error('Failed to delete post:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete post. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const columns = [
    {
      key: 'title',
      header: 'Title',
      cell: (post: BlogPost) => (
        <div className="max-w-[300px]">
          <p className="font-medium truncate">{post.title}</p>
          <p className="text-xs text-muted-foreground truncate">{post.slug}</p>
        </div>
      ),
    },
    {
      key: 'author',
      header: 'Author',
      cell: (post: BlogPost) => (
        <span className="text-sm">Unknown</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (post: BlogPost) => getStatusBadge(post.status),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (post: BlogPost) => (
        <div className="text-sm">
          {post.published_at ? (
            <span className="text-muted-foreground">{formatDate(post.published_at)}</span>
          ) : (
            <span className="text-muted-foreground">Updated {formatDate(post.updated_at ?? '')}</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (post: BlogPost) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {post.status === 'PUBLISHED' && (
              <DropdownMenuItem>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push(`/admin/blog/${post._id}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => handleDeleteClick(post)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'PUBLISHED', label: 'Published' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'ARCHIVED', label: 'Archived' },
      ],
    },
  ]

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Calculate stats
  const publishedCount = posts.filter((p) => p.status === 'PUBLISHED').length
  const draftCount = posts.filter((p) => p.status === 'DRAFT').length
  const totalViews = 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="text-sm text-muted-foreground">
            Manage blog posts and content
          </p>
        </div>
        <Button onClick={() => router.push('/admin/blog/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
            <FileCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
            <p className="text-xs text-muted-foreground">Live posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            <FilePenLine className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            <EyeIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={posts}
        columns={columns}
        searchKey="title"
        searchPlaceholder="Search posts..."
        filterOptions={filterOptions}
        pageSize={10}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the blog post.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
