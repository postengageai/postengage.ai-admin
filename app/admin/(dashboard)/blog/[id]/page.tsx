'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { blogApi } from '@/lib/api/blog'
import { MediaApi } from '@/lib/api/media'
import { BlogPost } from '@/lib/types'
import { ApiError } from '@/lib/http/errors'
import { TiptapEditor } from '@/components/admin/blog/tiptap-editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Loader2,
  ArrowLeft,
  Save,
  Image as ImageIcon,
  X
} from 'lucide-react'
import Image from 'next/image'

export default function BlogEditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const isNew = id === 'new'
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<BlogPost['status']>('DRAFT')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [coverImageId, setCoverImageId] = useState<string | null>(null)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)

  // SEO state
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [metaKeywords, setMetaKeywords] = useState<string[]>([])
  const [metaKeywordInput, setMetaKeywordInput] = useState('')

  const fetchPost = useCallback(async () => {
    if (isNew) return
    
    try {
      setIsLoading(true)
      const post = await blogApi.getPost(id as string)
      setTitle(post.title)
      setSlug(post.slug ?? "")
      setExcerpt(post.excerpt || '')
      setContent(post.content || '')
      setStatus(post.status)
      setTags(post.tags || [])
      setCoverImageId(post.cover_image || null)
      
      // SEO
      if (post.seo) {
        setMetaTitle(post.seo.meta_title || '')
        setMetaDescription(post.seo.meta_description || '')
        setMetaKeywords(post.seo.keywords || [])
      }
      
      if (post.cover_image) {
        try {
          const mediaResponse = await MediaApi.getById(post.cover_image)
          if (mediaResponse.data) {
            setCoverImageUrl(mediaResponse.data.url)
          }
        } catch (err) {
          console.error('Failed to fetch cover image:', err)
        }
      }
    } catch (error) {
      console.error('Failed to fetch post:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch blog post. Please try again.',
        variant: 'destructive',
      })
      router.push('/admin/blog')
    } finally {
      setIsLoading(false)
    }
  }, [id, isNew, router, toast])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (isNew) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    }
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmedInput = tagInput.trim()
      if (trimmedInput && !tags.includes(trimmedInput)) {
        setTags([...tags, trimmedInput])
        setTagInput('')
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleAddMetaKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmedInput = metaKeywordInput.trim()
      if (trimmedInput && !metaKeywords.includes(trimmedInput)) {
        setMetaKeywords([...metaKeywords, trimmedInput])
        setMetaKeywordInput('')
      }
    }
  }

  const handleRemoveMetaKeyword = (keywordToRemove: string) => {
    setMetaKeywords(metaKeywords.filter(k => k !== keywordToRemove))
  }

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploadingCover(true)
      const response = await MediaApi.upload(file, {
        name: file.name,
        category: 'blog_cover'
      })
      
      if (response.data) {
        setCoverImageId(response.data.id)
        setCoverImageUrl(response.data.url)
        toast({
          title: 'Cover image uploaded',
          description: 'The cover image has been successfully uploaded.'
        })
      }
    } catch (error) {
      console.error('Failed to upload cover image:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to upload cover image. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingCover(false)
    }
  }

  const handleRemoveCoverImage = () => {
    setCoverImageId(null)
    setCoverImageUrl(null)
  }

  const handleSave = async () => {
    if (!title || !slug) {
      toast({
        title: 'Validation Error',
        description: 'Title and Slug are required.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSaving(true)
      setValidationErrors({})
      
      const postData = {
        title,
        slug,
        excerpt,
        content,
        status,
        tags,
        cover_image_media_id: coverImageId,
        seo: {
          meta_title: metaTitle,
          meta_description: metaDescription,
          keywords: metaKeywords,
        },
      }

      if (isNew) {
        await blogApi.createPost(postData)
        toast({
          title: 'Post created',
          description: 'Your new blog post has been created.',
        })
      } else {
        await blogApi.updatePost(id as string, postData)
        toast({
          title: 'Post updated',
          description: 'Your blog post has been updated.',
        })
      }
      
      router.push('/admin/blog')
    } catch (error) {
      console.error('Failed to save post:', error)
      
      if (error instanceof ApiError && error.details?.errors) {
        setValidationErrors(error.details.errors as Record<string, string>)
        toast({
          title: 'Validation Error',
          description: 'Please fix the errors in the form.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save post. Please try again.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/blog')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isNew ? 'Create New Post' : 'Edit Post'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNew ? 'Draft your new blog post' : 'Manage your blog post content'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push('/admin/blog')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isNew ? 'Create Post' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Post title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={validationErrors.title ? 'border-destructive' : ''}
              />
              {validationErrors.title && (
                <p className="text-sm text-destructive">{validationErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="post-url-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={validationErrors.slug ? 'border-destructive' : ''}
              />
              {validationErrors.slug && (
                <p className="text-sm text-destructive">{validationErrors.slug}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <div className={`min-h-[400px] border rounded-md ${validationErrors.content ? 'border-destructive' : ''}`}>
                <TiptapEditor value={content} onChange={setContent} />
              </div>
              {validationErrors.content && (
                <p className="text-sm text-destructive">{validationErrors.content}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 p-4 border rounded-lg bg-card">
            <h3 className="font-medium">Publishing</h3>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as BlogPost['status'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-card">
            <h3 className="font-medium">Excerpt</h3>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Description</Label>
              <Textarea
                id="excerpt"
                placeholder="Brief summary for SEO and previews"
                className={`resize-none h-24 ${validationErrors.excerpt ? 'border-destructive' : ''}`}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
              {validationErrors.excerpt && (
                <p className="text-sm text-destructive">{validationErrors.excerpt}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-card">
            <h3 className="font-medium">Tags</h3>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-2 py-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Type and press Enter to add tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className={validationErrors.tags ? 'border-destructive' : ''}
              />
              {validationErrors.tags && (
                <p className="text-sm text-destructive">{validationErrors.tags}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-card">
            <h3 className="font-medium">Cover Image</h3>
            <div className="space-y-2">
              {coverImageUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                  <Image
                    src={coverImageUrl}
                    alt="Cover"
                    fill
                    className="object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemoveCoverImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center aspect-video w-full border-2 border-dashed rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                  <Label htmlFor="cover-image" className="cursor-pointer flex flex-col items-center gap-2">
                    {isUploadingCover ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {isUploadingCover ? 'Uploading...' : 'Upload Cover Image'}
                    </span>
                  </Label>
                  <Input
                    id="cover-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverImageUpload}
                    disabled={isUploadingCover}
                  />
                </div>
              )}
              {validationErrors.cover_image_media_id && (
                <p className="text-sm text-destructive mt-2">{validationErrors.cover_image_media_id}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-card">
            <h3 className="font-medium">SEO Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta-title">Meta Title</Label>
                <Input
                  id="meta-title"
                  placeholder="SEO Title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className={validationErrors['seo.meta_title'] ? 'border-destructive' : ''}
                />
                {validationErrors['seo.meta_title'] && (
                  <p className="text-sm text-destructive">{validationErrors['seo.meta_title']}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meta-description">Meta Description</Label>
                <Textarea
                  id="meta-description"
                  placeholder="SEO Description"
                  className={`resize-none h-24 ${validationErrors['seo.meta_description'] ? 'border-destructive' : ''}`}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                />
                {validationErrors['seo.meta_description'] && (
                  <p className="text-sm text-destructive">{validationErrors['seo.meta_description']}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Meta Keywords</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {metaKeywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="px-2 py-1">
                      {keyword}
                      <button
                        onClick={() => handleRemoveMetaKeyword(keyword)}
                        className="ml-1 hover:text-destructive focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Type and press Enter to add keywords"
                  value={metaKeywordInput}
                  onChange={(e) => setMetaKeywordInput(e.target.value)}
                  onKeyDown={handleAddMetaKeyword}
                  className={validationErrors['seo.keywords'] ? 'border-destructive' : ''}
                />
                {validationErrors['seo.keywords'] && (
                  <p className="text-sm text-destructive">{validationErrors['seo.keywords']}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
