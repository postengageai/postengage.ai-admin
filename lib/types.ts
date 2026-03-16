
export interface NewsletterSubscriber {
  _id: string;
  email: string;
  is_active: boolean;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'USER';
  avatar: string;
  createdAt: string;
  lastLoginAt: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface KPIMetric {
  label: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  period: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user: string;
  metadata?: Record<string, any>;
}

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'SUPPORT'

export interface BlogPost {
  _id: string;
  id?: string;
  title: string;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  slug?: string;
  excerpt?: string;
  content?: string;
  author?: string | { name: string };
  published_at?: string | null;
  publishedAt?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  viewCount?: number;
  tags?: string[];
  cover_image?: string | null;
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
}
