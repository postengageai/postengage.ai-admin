// Backend error response structure
export interface ErrorResponseDetails {
  documentation_url: string;
  action?: string;
  support_reference?: string;
  [key: string]: unknown;
}

export interface BackendErrorResponse {
  message: string;
  code: string;
  details: ErrorResponseDetails;
  timestamp: string;
}

// Base error class
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: ErrorResponseDetails;
  public readonly timestamp: string;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: ErrorResponseDetails
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  // Factory method to create ApiError from backend response
  static fromBackendResponse(
    statusCode: number,
    errorResponse: BackendErrorResponse
  ): ApiError {
    return new ApiError(
      statusCode,
      errorResponse.message,
      errorResponse.code,
      errorResponse.details
    );
  }

  // Factory method to create ApiError from network/unknown errors
  static fromNetworkError(
    statusCode: number,
    message: string,
    originalError?: unknown
  ): ApiError {
    return new ApiError(statusCode, message, undefined, {
      documentation_url: 'https://docs.postengage.ai/errors',
      originalError:
        originalError instanceof Error
          ? { name: originalError.name, message: originalError.message }
          : originalError,
    });
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      statusCode: this.statusCode,
      name: this.name,
    };
  }
}

// Specific error types for better categorization
export class ClientError extends ApiError {
  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: ErrorResponseDetails
  ) {
    super(statusCode, message, code, details);
    this.name = 'ClientError';
  }
}

export class ServerError extends ApiError {
  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: ErrorResponseDetails
  ) {
    super(statusCode, message, code, details);
    this.name = 'ServerError';
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, originalError?: unknown) {
    super(0, message, undefined, {
      documentation_url: 'https://docs.postengage.ai/errors',
      originalError:
        originalError instanceof Error
          ? { name: originalError.name, message: originalError.message }
          : originalError,
    });
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ApiError {
  constructor() {
    super(408, 'Request timeout', undefined, {
      documentation_url: 'https://docs.postengage.ai/errors',
      action: 'retry_request',
    });
    this.name = 'TimeoutError';
  }
}

// Utility function to check if error is an ApiError
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// Utility function to check if error is from backend
export function isBackendError(error: unknown): error is ApiError {
  return isApiError(error) && error.code !== undefined;
}

// Utility function to create appropriate error type based on status code
export function createAppropriateError(
  statusCode: number,
  errorResponse?: BackendErrorResponse
): ApiError {
  if (errorResponse) {
    return ApiError.fromBackendResponse(statusCode, errorResponse);
  }

  if (statusCode >= 400 && statusCode < 500) {
    return new ClientError(
      statusCode,
      `Client error: ${statusCode}`,
      undefined,
      { documentation_url: 'https://docs.postengage.ai/errors' }
    );
  }

  if (statusCode >= 500) {
    return new ServerError(
      statusCode,
      `Server error: ${statusCode}`,
      undefined,
      { documentation_url: 'https://docs.postengage.ai/errors' }
    );
  }

  return ApiError.fromNetworkError(statusCode, `Unknown error: ${statusCode}`);
}
