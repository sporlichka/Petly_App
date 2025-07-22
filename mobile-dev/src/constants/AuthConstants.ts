// constants/AuthConstants.ts

export const AUTH_CONSTANTS = {
  // Время ожидания между повторными отправками email
  RESEND_EMAIL_COOLDOWN: 60, // секунды
  
  // Интервал проверки статуса верификации
  VERIFICATION_CHECK_INTERVAL: 30, // секунды
  
  // Максимальное количество попыток проверки
  MAX_VERIFICATION_ATTEMPTS: 20, // 10 минут при интервале 30 сек
  
  // Время жизни токена верификации
  VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60, // 24 часа в секундах
} as const;

export const EMAIL_VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  ERROR: 'error',
  EXPIRED: 'expired',
} as const;

export const AUTH_ERROR_MESSAGES = {
  EMAIL_NOT_VERIFIED: 'Пожалуйста, подтвердите ваш email перед входом',
  VERIFICATION_EXPIRED: 'Срок действия ссылки истек. Отправьте новое письмо',
  VERIFICATION_FAILED: 'Ошибка подтверждения email. Попробуйте еще раз',
  INVALID_CREDENTIALS: 'Incorrect email or password',
  EMAIL_ALREADY_EXISTS: 'Пользователь с таким email уже существует',
  WEAK_PASSWORD: 'Пароль должен содержать минимум 6 символов',
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету',
  UNKNOWN_ERROR: 'Произошла неизвестная ошибка',
} as const;

export const AUTH_SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Регистрация успешна! Проверьте вашу почту',
  EMAIL_VERIFICATION_SENT: 'Письмо с подтверждением отправлено',
  EMAIL_VERIFIED: 'Email успешно подтвержден!',
  LOGIN_SUCCESS: 'Вход выполнен успешно',
  PASSWORD_CHANGED: 'Пароль успешно изменен',
} as const; 