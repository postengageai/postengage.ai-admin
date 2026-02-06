
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

export interface BlogPost {
  id: string;
  title: string;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  slug?: string;
  excerpt?: string;
  author?: { name: string };
  publishedAt?: string;
  createdAt?: string;
  viewCount?: number;
}
