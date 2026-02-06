import { httpClient } from '@/lib/http/client';
import { NewsletterSubscriber } from '@/lib/types';

export interface SubscriberListResponse {
  items: NewsletterSubscriber[];
  total: number;
}

class NewsletterApi {
  private readonly BASE_PATH = '/api/v1/admin/newsletter';

  async getSubscribers(params?: {
    page?: number;
    limit?: number;
  }): Promise<SubscriberListResponse> {
    const response = await httpClient.get<NewsletterSubscriber[]>(`${this.BASE_PATH}/subscribers`, {
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
}

export const newsletterApi = new NewsletterApi();
