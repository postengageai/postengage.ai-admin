import { httpClient, SuccessResponse } from '@/lib/http/client';
import { BlogPost } from '@/lib/types';
import { CreateBlogPostRequest, UpdateBlogPostRequest } from '@/lib/schemas/blog';

export interface BlogPostListResponse {
  items: BlogPost[];
  total: number;
}

class BlogApi {
  private readonly BASE_PATH = '/api/v1/admin/blog';

  async getPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<BlogPostListResponse> {
    const response = await httpClient.get<BlogPost[]>(`${this.BASE_PATH}/posts`, {
      params,
    });
    
    if (!response.data || !response.data.data) {
      if (response.data && Array.isArray(response.data.data)) {
         // ok
      } else {
         throw new Error('No data received from backend');
      }
    }

    return {
      items: response.data.data,
      total: response.data.pagination?.total || 0,
    };
  }

  async getPost(id: string): Promise<BlogPost> {
    const response = await httpClient.get<BlogPost>(`${this.BASE_PATH}/posts/${id}`);
    if (!response.data || !response.data.data) {
      throw new Error('No data received from backend');
    }
    return response.data.data;
  }

  async createPost(data: CreateBlogPostRequest): Promise<BlogPost> {
    const response = await httpClient.post<BlogPost>(`${this.BASE_PATH}/posts`, data);
    if (!response.data || !response.data.data) {
      throw new Error('No data received from backend');
    }
    return response.data.data;
  }

  async updatePost(id: string, data: UpdateBlogPostRequest): Promise<BlogPost> {
    const response = await httpClient.put<BlogPost>(`${this.BASE_PATH}/posts/${id}`, data);
    if (!response.data || !response.data.data) {
      throw new Error('No data received from backend');
    }
    return response.data.data;
  }

  async deletePost(id: string): Promise<void> {
    await httpClient.delete(`${this.BASE_PATH}/posts/${id}`);
  }
}

export const blogApi = new BlogApi();
