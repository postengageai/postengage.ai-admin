import {
  Referral,
  ReferralUsage,
  CreateReferralRequest,
} from '../schemas/referrals';
import { httpClient } from '../http/client';

const REFERRALS_BASE_URL = '/api/v1/admin/referrals';

export class ReferralsApi {
  // Get all referrals
  static async getAll(): Promise<Referral[]> {
    const response = await httpClient.get<Referral[]>(REFERRALS_BASE_URL);
    if (!response.data || !response.data.data) {
      return [];
    }
    return response.data.data;
  }

  // Create referral
  static async create(
    request: CreateReferralRequest
  ): Promise<Referral> {
    const response = await httpClient.post<Referral>(
      REFERRALS_BASE_URL,
      request
    );
    if (!response.data || !response.data.data) {
      throw new Error('No data received');
    }
    return response.data.data;
  }

  // Expire referral
  static async expire(id: string): Promise<Referral> {
    const response = await httpClient.patch<Referral>(
      `${REFERRALS_BASE_URL}/${id}/expire`,
      {}
    );
    if (!response.data || !response.data.data) {
      throw new Error('No data received');
    }
    return response.data.data;
  }

  // Get referral usages
  static async getUsages(id: string): Promise<ReferralUsage[]> {
    const response = await httpClient.get<ReferralUsage[]>(
      `${REFERRALS_BASE_URL}/${id}/usages`
    );
    if (!response.data || !response.data.data) {
      return [];
    }
    return response.data.data;
  }
}
