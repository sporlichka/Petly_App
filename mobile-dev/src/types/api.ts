// types/api.ts

import { User } from './index';

// Firebase Auth API Responses
export interface FirebaseLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface FirebaseRegisterResponse {
  user: User;
  email_verification_sent: boolean;
  message?: string;
}

export interface FirebaseEmailVerificationResponse {
  success: boolean;
  message: string;
  email?: string;
}

export interface FirebaseEmailVerificationStatusResponse {
  email: string;
  verified: boolean;
  verification_sent: boolean;
  last_verification_attempt?: string;
}

export interface FirebasePasswordChangeResponse {
  success: boolean;
  message: string;
}

export interface FirebaseLogoutResponse {
  success: boolean;
  message: string;
}

// Error Responses
export interface FirebaseAuthErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ApiErrorResponse {
  detail: string;
  code?: string;
  status_code?: number;
}

// Request Types
export interface FirebaseLoginRequest {
  email: string;
  password: string;
}

export interface FirebaseRegisterRequest {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
}

export interface FirebasePasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface FirebaseEmailVerificationRequest {
  email: string;
}

export interface FirebaseEmailVerificationTokenRequest {
  token: string;
}

export interface FirebaseLogoutRequest {
  refresh_token: string;
}

// Utility Types
export type FirebaseAuthResponse = 
  | FirebaseLoginResponse
  | FirebaseRegisterResponse
  | FirebaseEmailVerificationResponse
  | FirebaseEmailVerificationStatusResponse
  | FirebasePasswordChangeResponse
  | FirebaseLogoutResponse;

export type FirebaseAuthRequest = 
  | FirebaseLoginRequest
  | FirebaseRegisterRequest
  | FirebasePasswordChangeRequest
  | FirebaseEmailVerificationRequest
  | FirebaseEmailVerificationTokenRequest
  | FirebaseLogoutRequest; 