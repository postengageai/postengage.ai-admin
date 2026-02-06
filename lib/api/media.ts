import { httpClient, SuccessResponse } from '../http/client';
import { Media, UploadMediaRequest, UpdateMediaRequest } from '../schemas/media';

const MEDIA_BASE_URL = '/api/v1/media';

export class MediaApi {
  // Upload media
  static async upload(
    file: File,
    metadata?: UploadMediaRequest
  ): Promise<SuccessResponse<Media>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      if (metadata.name) formData.append('name', metadata.name);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.alt_text) formData.append('alt_text', metadata.alt_text);
      if (metadata.category) formData.append('category', metadata.category);
      if (metadata.tags && metadata.tags.length > 0) {
        // Backend expects tags as array? Or comma separated?
        // Contract says: "tags (comma-joined)" in processing description, but DTO says string[]
        // Let's send as multiple 'tags' fields if standard FormData array, or comma separated string if backend parses it that way.
        // Planning doc says: "tags?: string[]". 
        // Usually nestjs with multer handles array fields.
        metadata.tags.forEach(tag => formData.append('tags', tag));
      }
    }

    const response = await httpClient.post<Media>(
      `${MEDIA_BASE_URL}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data!;
  }

  // Get all media
  static async getAll(params?: {
    status?: string;
    category?: string;
    search?: string;
    limit?: number;
    page?: number;
  }): Promise<SuccessResponse<Media[]>> {
    const response = await httpClient.get<Media[]>(MEDIA_BASE_URL, {
      params,
    });
    return response.data!;
  }

  // Get media by ID
  static async getById(id: string): Promise<SuccessResponse<Media>> {
    const response = await httpClient.get<Media>(`${MEDIA_BASE_URL}/${id}`);
    return response.data!;
  }

  // Update media
  static async update(
    id: string,
    data: UpdateMediaRequest
  ): Promise<SuccessResponse<Media>> {
    const response = await httpClient.put<Media>(
      `${MEDIA_BASE_URL}/${id}`,
      data
    );
    return response.data!;
  }

  // Delete media
  static async delete(id: string): Promise<void> {
    await httpClient.delete(`${MEDIA_BASE_URL}/${id}`);
  }
}
