// utils/authUtils.ts

import { AuthError, AuthErrorType } from '../types';
import { AUTH_ERROR_MESSAGES } from '../constants/AuthConstants';

/**
 * Создает объект ошибки авторизации
 */
export function createAuthError(
  type: AuthErrorType,
  message?: string,
  code?: string
): AuthError {
  return {
    type,
    message: message || AUTH_ERROR_MESSAGES[type] || AUTH_ERROR_MESSAGES.UNKNOWN_ERROR,
    code,
  };
}

/**
 * Парсит ошибку из API ответа
 */
export function parseAuthError(error: any): AuthError {
  if (error?.type && Object.values(AuthErrorType).includes(error.type)) {
    return error as AuthError;
  }

  // Парсим сообщение об ошибке и HTTP статус
  const errorMessage = error?.message || error?.detail || error?.toString() || '';
  const errorCode = error?.code || '';
  const httpStatus = error?.status;

  // Проверяем HTTP статус - 401 обычно означает неправильные учетные данные
  if (httpStatus === 401) {
    // Дополнительно проверяем сообщение для исключений
    if (errorMessage.toLowerCase().includes('authentication expired') ||
        errorMessage.toLowerCase().includes('session expired') ||
        errorMessage.toLowerCase().includes('token')) {
      return createAuthError(AuthErrorType.NETWORK_ERROR, 'Session expired. Please log in again.', errorCode);
    }
    // Для всех остальных 401 - это неправильные учетные данные
    return createAuthError(AuthErrorType.INVALID_CREDENTIALS, 'Incorrect email or password', errorCode);
  }

  // Определяем тип ошибки по сообщению или коду
  if (errorMessage.toLowerCase().includes('email not verified') || 
      errorCode === 'EMAIL_NOT_VERIFIED') {
    return createAuthError(AuthErrorType.EMAIL_NOT_VERIFIED, errorMessage, errorCode);
  }

  if (errorMessage.toLowerCase().includes('verification expired') || 
      errorCode === 'VERIFICATION_EXPIRED') {
    return createAuthError(AuthErrorType.VERIFICATION_EXPIRED, errorMessage, errorCode);
  }

  if (errorMessage.toLowerCase().includes('verification failed') || 
      errorCode === 'VERIFICATION_FAILED') {
    return createAuthError(AuthErrorType.VERIFICATION_FAILED, errorMessage, errorCode);
  }

  if (errorMessage.toLowerCase().includes('invalid credentials') || 
      errorMessage.toLowerCase().includes('incorrect username or password') ||
      errorMessage.toLowerCase().includes('wrong password') ||
      errorCode === 'INVALID_CREDENTIALS') {
    return createAuthError(AuthErrorType.INVALID_CREDENTIALS, 'Incorrect email or password', errorCode);
  }

  if (errorMessage.toLowerCase().includes('email already exists') || 
      errorMessage.toLowerCase().includes('email already registered') ||
      errorCode === 'EMAIL_ALREADY_EXISTS') {
    return createAuthError(AuthErrorType.EMAIL_ALREADY_EXISTS, errorMessage, errorCode);
  }

  if (errorMessage.toLowerCase().includes('weak password') || 
      errorCode === 'WEAK_PASSWORD') {
    return createAuthError(AuthErrorType.WEAK_PASSWORD, errorMessage, errorCode);
  }

  if (errorMessage.toLowerCase().includes('network') || 
      errorMessage.toLowerCase().includes('connection') ||
      errorCode === 'NETWORK_ERROR') {
    return createAuthError(AuthErrorType.NETWORK_ERROR, errorMessage, errorCode);
  }

  // По умолчанию возвращаем неизвестную ошибку
  return createAuthError(AuthErrorType.NETWORK_ERROR, errorMessage, errorCode);
}

/**
 * Проверяет, является ли ошибка связанной с верификацией email
 */
export function isVerificationError(error: AuthError): boolean {
  return [
    AuthErrorType.EMAIL_NOT_VERIFIED,
    AuthErrorType.VERIFICATION_EXPIRED,
    AuthErrorType.VERIFICATION_FAILED,
  ].includes(error.type);
}

/**
 * Проверяет, является ли ошибка связанной с сетевыми проблемами
 */
export function isNetworkError(error: AuthError): boolean {
  return error.type === AuthErrorType.NETWORK_ERROR;
}

/**
 * Проверяет, является ли ошибка связанной с неверными учетными данными
 */
export function isCredentialsError(error: AuthError): boolean {
  return error.type === AuthErrorType.INVALID_CREDENTIALS;
}

/**
 * Валидирует email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Валидирует пароль
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Маскирует email для отображения
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  
  if (localPart.length <= 2) {
    return email; // Не маскируем короткие email
  }

  const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
}

/**
 * Форматирует время для обратного отсчета
 */
export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
} 