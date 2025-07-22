// constants/ApiConstants.ts

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    DELETE_PROFILE: '/auth/delete-profile',
    
    // Email verification endpoints
    RESEND_VERIFICATION: '/auth/resend-verification',
    CHECK_VERIFICATION: '/auth/check-verification',
    VERIFY_EMAIL_STATUS: (email: string) => `/auth/verify-email-status/${email}`,
    VERIFY_EMAIL: '/auth/verify-email',
  },
  
  // Pet endpoints
  PETS: {
    LIST: '/pets/',
    CREATE: '/pets/',
    UPDATE: (id: number) => `/pets/${id}`,
    DELETE: (id: number) => `/pets/${id}`,
  },
  
  // Activity endpoints
  ACTIVITIES: {
    LIST: '/records/',
    CREATE: '/records/',
    UPDATE: (id: number) => `/records/${id}`,
    DELETE: (id: number) => `/records/${id}`,
    BY_DATE: '/records/by-date',
    BY_DATE_RANGE: '/records/by-date-range',
    ALL_USER_PETS: '/records/all-user-pets',
    DISABLE_ALL_NOTIFICATIONS: '/records/disable-all-notifications',
  },
  
  // AI Chat endpoints
  AI: {
    ASSIST: '/ai/assist',
    SESSIONS: '/ai/sessions',
    SESSION_MESSAGES: (sessionId: string) => `/ai/sessions/${sessionId}/messages`,
    DELETE_SESSION: (sessionId: string) => `/ai/sessions/${sessionId}`,
    CLEAR_SESSION_MESSAGES: (sessionId: string) => `/ai/sessions/${sessionId}/messages`,
  },
} as const;

export const API_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const API_ERROR_CODES = {
  // Firebase Auth errors
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  VERIFICATION_EXPIRED: 'VERIFICATION_EXPIRED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
} as const;

export const API_TIMEOUTS = {
  REQUEST: 30000, // 30 seconds
  REFRESH_TOKEN: 10000, // 10 seconds
  VERIFICATION_CHECK: 5000, // 5 seconds
} as const;

export const API_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent',
} as const; 