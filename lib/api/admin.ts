import { httpClient, SuccessResponse } from '../http/client';

const BASE = '/api/v1/admin';

// ─── Shared types ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface PaginationParams {
  limit?: number;
  page?: number;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  _id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  status: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export const usersApi = {
  list: (p?: PaginationParams & { search?: string }) =>
    httpClient.get<PaginatedResponse<AdminUser>>(`${BASE}/users`, { params: p }),
  getById: (id: string) => httpClient.get<AdminUser>(`${BASE}/users/${id}`),
  update: (id: string, data: Partial<AdminUser>) =>
    httpClient.patch<AdminUser>(`${BASE}/users/${id}`, data),
  delete: (id: string) => httpClient.delete(`${BASE}/users/${id}`),
  getCredits: (id: string) => httpClient.get(`${BASE}/users/${id}/credits`),
};

// ─── Credits ──────────────────────────────────────────────────────────────────

export const creditsApi = {
  list: (p?: PaginationParams) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/credits`, { params: p }),
  getByUser: (userId: string) =>
    httpClient.get(`${BASE}/credits/user/${userId}`),
  adjust: (userId: string, data: { amount: number; reason: string }) =>
    httpClient.post(`${BASE}/credits/adjust`, { userId, ...data }),
};

// ─── Social Accounts ──────────────────────────────────────────────────────────

export interface AdminSocialAccount {
  _id: string;
  username: string;
  platform: string;
  user_id: string;
  is_active: boolean;
  followers_count?: number;
  created_at: string;
}

export const socialAccountsApi = {
  list: (p?: PaginationParams) =>
    httpClient.get<PaginatedResponse<AdminSocialAccount>>(`${BASE}/social-accounts`, { params: p }),
  getById: (id: string) => httpClient.get<AdminSocialAccount>(`${BASE}/social-accounts/${id}`),
  delete: (id: string) => httpClient.delete(`${BASE}/social-accounts/${id}`),
};

// ─── Automations ──────────────────────────────────────────────────────────────

export interface AdminAutomation {
  _id: string;
  name: string;
  status: string;
  trigger_count?: number;
  user_id: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

export const automationsApi = {
  list: (p?: PaginationParams) =>
    httpClient.get<PaginatedResponse<AdminAutomation>>(`${BASE}/automations`, { params: p }),
  getById: (id: string) => httpClient.get<AdminAutomation>(`${BASE}/automations/${id}`),
  delete: (id: string) => httpClient.delete(`${BASE}/automations/${id}`),
};

// ─── Bots ─────────────────────────────────────────────────────────────────────

export interface AdminBot {
  _id: string;
  name: string;
  status: string;
  ai_model?: string;
  user_id: string;
  stats: {
    total_replies: number;
    total_escalations: number;
    avg_confidence?: number;
  };
  created_at: string;
}

export const botsApi = {
  list: (p?: PaginationParams) =>
    httpClient.get<PaginatedResponse<AdminBot>>(`${BASE}/bots`, { params: p }),
  getById: (id: string) => httpClient.get<AdminBot>(`${BASE}/bots/${id}`),
  delete: (id: string) => httpClient.delete(`${BASE}/bots/${id}`),
};

// ─── Knowledge Sources ────────────────────────────────────────────────────────

export const knowledgeSourcesApi = {
  list: (p?: PaginationParams) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/knowledge-sources`, { params: p }),
  getById: (id: string) => httpClient.get(`${BASE}/knowledge-sources/${id}`),
  delete: (id: string) => httpClient.delete(`${BASE}/knowledge-sources/${id}`),
};

// ─── Brand Voices ─────────────────────────────────────────────────────────────

export const brandVoicesApi = {
  list: (p?: PaginationParams) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/brand-voices`, { params: p }),
  getById: (id: string) => httpClient.get(`${BASE}/brand-voices/${id}`),
  delete: (id: string) => httpClient.delete(`${BASE}/brand-voices/${id}`),
};

// ─── Voice DNA ────────────────────────────────────────────────────────────────

export const voiceDnaApi = {
  list: (p?: PaginationParams) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/voice-dna`, { params: p }),
  getById: (id: string) => httpClient.get(`${BASE}/voice-dna/${id}`),
  delete: (id: string) => httpClient.delete(`${BASE}/voice-dna/${id}`),
};

// ─── Intelligence Logs ────────────────────────────────────────────────────────

export const intelligenceLogsApi = {
  list: (p?: PaginationParams & { botId?: string; type?: string }) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/intelligence-logs`, { params: p }),
  getById: (id: string) => httpClient.get(`${BASE}/intelligence-logs/${id}`),
};

// ─── Conversations ────────────────────────────────────────────────────────────

export const conversationsApi = {
  list: (p?: PaginationParams) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/conversations`, { params: p }),
  getById: (id: string) => httpClient.get(`${BASE}/conversations/${id}`),
};

// ─── Leads ────────────────────────────────────────────────────────────────────

export interface AdminLead {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  source: string;
  status: string;
  score?: number;
  created_at: string;
}

export const leadsApi = {
  list: (p?: PaginationParams & { status?: string }) =>
    httpClient.get<PaginatedResponse<AdminLead>>(`${BASE}/leads`, { params: p }),
  getById: (id: string) => httpClient.get<AdminLead>(`${BASE}/leads/${id}`),
  update: (id: string, data: Partial<AdminLead>) =>
    httpClient.patch<AdminLead>(`${BASE}/leads/${id}`, data),
  delete: (id: string) => httpClient.delete(`${BASE}/leads/${id}`),
};

// ─── Payments ─────────────────────────────────────────────────────────────────

export const paymentsApi = {
  list: (p?: PaginationParams & { status?: string }) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/payments`, { params: p }),
  getById: (id: string) => httpClient.get(`${BASE}/payments/${id}`),
};

export const ordersApi = {
  list: (p?: PaginationParams & { status?: string }) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/orders`, { params: p }),
  getById: (id: string) => httpClient.get(`${BASE}/orders/${id}`),
  update: (id: string, data: any) => httpClient.patch(`${BASE}/orders/${id}`, data),
};

export const invoicesApi = {
  list: (p?: PaginationParams) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/invoices`, { params: p }),
  getById: (id: string) => httpClient.get(`${BASE}/invoices/${id}`),
};

// ─── Credit Packages ──────────────────────────────────────────────────────────

export interface AdminCreditPackage {
  _id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  is_active: boolean;
  is_popular?: boolean;
  description?: string;
  features?: string[];
  created_at: string;
}

export const creditPackagesApi = {
  list: () => httpClient.get<PaginatedResponse<AdminCreditPackage>>(`${BASE}/credit-packages`),
  getById: (id: string) => httpClient.get<AdminCreditPackage>(`${BASE}/credit-packages/${id}`),
  create: (data: Partial<AdminCreditPackage>) =>
    httpClient.post<AdminCreditPackage>(`${BASE}/credit-packages`, data),
  update: (id: string, data: Partial<AdminCreditPackage>) =>
    httpClient.patch<AdminCreditPackage>(`${BASE}/credit-packages/${id}`, data),
  delete: (id: string) => httpClient.delete(`${BASE}/credit-packages/${id}`),
};

// ─── Currencies ───────────────────────────────────────────────────────────────

export const currenciesApi = {
  list: () => httpClient.get<PaginatedResponse<any>>(`${BASE}/currencies`),
  create: (data: any) => httpClient.post(`${BASE}/currencies`, data),
  update: (id: string, data: any) => httpClient.patch(`${BASE}/currencies/${id}`, data),
  delete: (id: string) => httpClient.delete(`${BASE}/currencies/${id}`),
};

// ─── Affiliates ───────────────────────────────────────────────────────────────

export const affiliatesApi = {
  list: (p?: PaginationParams) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/affiliates`, { params: p }),
  getById: (id: string) => httpClient.get(`${BASE}/affiliates/${id}`),
  update: (id: string, data: any) => httpClient.patch(`${BASE}/affiliates/${id}`, data),
};

// ─── Media ────────────────────────────────────────────────────────────────────

export const mediaApi = {
  list: (p?: PaginationParams) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/media`, { params: p }),
  delete: (id: string) => httpClient.delete(`${BASE}/media/${id}`),
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (p?: PaginationParams) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/notifications`, { params: p }),
  send: (data: { userId: string; title: string; message: string; type: string }) =>
    httpClient.post(`${BASE}/notifications/send`, data),
};

// ─── Activity Logs ────────────────────────────────────────────────────────────

export const activityLogsApi = {
  list: (p?: PaginationParams & { userId?: string; action?: string }) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/activity-logs`, { params: p }),
};

// ─── Flagged Replies ──────────────────────────────────────────────────────────

export const flaggedRepliesApi = {
  list: (p?: PaginationParams & { status?: string }) =>
    httpClient.get<PaginatedResponse<any>>(`${BASE}/flagged-replies`, { params: p }),
  getById: (id: string) => httpClient.get(`${BASE}/flagged-replies/${id}`),
  update: (id: string, data: any) => httpClient.patch(`${BASE}/flagged-replies/${id}`, data),
};

// ─── Overview ─────────────────────────────────────────────────────────────────

export const overviewApi = {
  get: () => httpClient.get<any>(`${BASE}/overview`),
};

// ─── Prompt Management ────────────────────────────────────────────────────────

export interface PromptDefinition {
  _id: string;
  name: string;
  slug: string;
  type: string;
  role: string;
  description?: string;
  tags?: string[];
  notes?: string;
  is_active: boolean;
  active_version_id?: string | null;
  latest_version_number: number;
  created_at: string;
  updated_at: string;
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'string[]' | 'object';
  required: boolean;
  description?: string;
  default_value?: string;
  filter?: string;
}

export interface PromptParsingConfig {
  strategy: 'plain_text' | 'json_extract' | 'key_value' | 'regex_extract' | 'json_schema';
  json_path?: string;
  required_keys?: string[];
  pattern?: string;
  capture_group?: number;
  schema?: Record<string, unknown>;
  fallback?: string;
}

export interface PromptModelConfig {
  preferred_model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface PromptVersion {
  _id: string;
  definition_id: string;
  version_number: number;
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  template: string;
  variables: PromptVariable[];
  parsing_config: PromptParsingConfig;
  model_config?: PromptModelConfig | null;
  content_hash: string;
  change_message?: string;
  created_by?: string | null;
  activated_by?: string | null;
  activated_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const promptsApi = {
  // Definitions
  listDefinitions: (p?: PaginationParams & { type?: string; is_active?: boolean }) =>
    httpClient.get<PaginatedResponse<PromptDefinition>>(`${BASE}/prompts`, { params: p }),
  getDefinition: (id: string) =>
    httpClient.get<{ definition: PromptDefinition; versions: PromptVersion[] }>(`${BASE}/prompts/${id}`),
  getDefinitionBySlug: (slug: string) =>
    httpClient.get<{ definition: PromptDefinition; versions: PromptVersion[] }>(`${BASE}/prompts/slug/${slug}`),
  createDefinition: (data: {
    name: string; slug: string; type: string; role: string;
    description?: string; tags?: string[]; notes?: string;
  }) => httpClient.post<PromptDefinition>(`${BASE}/prompts`, data),
  updateDefinition: (id: string, data: {
    name?: string; description?: string; tags?: string[];
    notes?: string; is_active?: boolean;
  }) => httpClient.patch<PromptDefinition>(`${BASE}/prompts/${id}`, data),

  // Versions
  listVersions: (definitionId: string) =>
    httpClient.get<PromptVersion[]>(`${BASE}/prompts/${definitionId}/versions`),
  getActiveVersion: (definitionId: string) =>
    httpClient.get<PromptVersion | null>(`${BASE}/prompts/${definitionId}/versions/active`),
  createVersion: (definitionId: string, data: {
    template: string;
    variables?: PromptVariable[];
    parsing_config: PromptParsingConfig;
    model_config?: PromptModelConfig;
    change_message?: string;
  }) => httpClient.post<PromptVersion>(`${BASE}/prompts/${definitionId}/versions`, data),
  activateVersion: (versionId: string) =>
    httpClient.patch<PromptVersion>(`${BASE}/prompts/versions/${versionId}/activate`),
  deprecateVersion: (versionId: string) =>
    httpClient.patch<PromptVersion>(`${BASE}/prompts/versions/${versionId}/deprecate`),
  archiveVersion: (versionId: string) =>
    httpClient.patch<PromptVersion>(`${BASE}/prompts/versions/${versionId}/archive`),
  previewVersion: (versionId: string, variables?: Record<string, unknown>) =>
    httpClient.post<{ text: string; version_number: number; version_id: string }>(
      `${BASE}/prompts/versions/${versionId}/preview`,
      { variables }
    ),
  testParse: (versionId: string, rawResponse: string) =>
    httpClient.post<{ data: unknown }>(`${BASE}/prompts/versions/${versionId}/parse-test`, {
      raw_response: rawResponse,
    }),
};
