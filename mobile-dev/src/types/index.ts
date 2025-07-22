// types/index.ts

export type RepeatType = "none" | "day" | "week" | "month" | "year";

export type WeightUnit = "kg" | "lb";

export type PetGender = "Male" | "Female";

export interface PetFormData {
  name: string;
  species: string;
  breed: string;
  gender: PetGender;
  birthdate: Date;
  weight: string;
  weight_unit: WeightUnit;
  notes: string;
}

export interface ActivityRecord {
  id: number;
  pet_id: number;
  category: "FEEDING" | "CARE" | "ACTIVITY";
  title: string;
  date: string;
  time: string;
  notify: boolean;
  notes?: string;
  food_type?: string;
  quantity?: string;
  duration?: string;
  repeat_type: RepeatType;
  repeat_interval: number;
  repeat_end_date?: string | null;
  repeat_count?: number | null;
}

export interface VirtualActivityRecord extends ActivityRecord {
  isVirtual?: boolean;
  originalActivityId?: number;
  virtualIndex?: number;
}

export interface ActivityRecordCreate {
  pet_id: number;
  category: "FEEDING" | "CARE" | "ACTIVITY";
  title: string;
  date: string;
  time: string;
  notify?: boolean;
  notes?: string;
  food_type?: string;
  quantity?: string;
  duration?: string;
  repeat_type: RepeatType;
  repeat_interval: number;
  repeat_end_date?: string | null;
  repeat_count?: number | null;
}

export interface ActivityRecordUpdate {
  category?: "FEEDING" | "CARE" | "ACTIVITY";
  title?: string;
  date?: string;
  time?: string;
  notify?: boolean;
  notes?: string;
  food_type?: string;
  quantity?: string;
  duration?: string;
  repeat_type?: RepeatType;
  repeat_interval?: number;
  repeat_end_date?: string | null;
  repeat_count?: number | null;
}

// --- AUTH & USER ---
export interface User {
  id: number;
  email: string;
  username?: string;
  full_name?: string;
  is_active: boolean;
  email_verified?: boolean; // Новое поле для Firebase (опционально)
  firebase_uid?: string;   // Новое поле для Firebase
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  username: string; // убираю ? чтобы сделать поле обязательным
  full_name?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// Новые типы для Firebase авторизации
export interface FirebaseAuthResponse extends AuthResponse {
  email_verification_sent?: boolean;
}

export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message?: string;
}

export interface EmailVerificationStatus {
  email: string;
  email_verified: boolean;
  firebase_user?: boolean;
  message?: string;
}

// Новые типы ошибок авторизации
export enum AuthErrorType {
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  VERIFICATION_EXPIRED = 'VERIFICATION_EXPIRED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  code?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
  device_id?: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

// --- PETS ---
export interface Pet {
  id: number;
  name: string;
  species?: string;
  breed?: string;
  birthdate?: string;
  weight?: number;
  weight_unit?: WeightUnit;
  gender?: string;
  notes?: string;
  // Добавь другие поля по необходимости
}

export interface PetCreate {
  name: string;
  species?: string;
  breed?: string;
  birthdate?: string;
  weight?: number;
  weight_unit?: WeightUnit;
  gender?: string;
  notes?: string;
}

export interface PetUpdate {
  name?: string;
  species?: string;
  breed?: string;
  birthdate?: string;
  weight?: number;
  weight_unit?: WeightUnit;
  gender?: string;
  notes?: string;
}

// --- AI Chat ---
export interface ChatRequest {
  message: string;
  session_id?: string;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
}

export interface ChatSession {
  id: string;
  created_at: string;
  // Добавь другие поля по необходимости
}

export interface ChatMessage {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isUser?: boolean;
}

// --- API Error ---
export interface ApiError {
  detail?: string;
}

// --- Navigation Types ---
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  EmailVerification: { token: string };
  EmailVerificationPending: { email: string };
};

export type HomeStackParamList = {
  PetList: undefined;
  PetDetail: { petId: number };
  AddPet: {
    species?: string;
    allowSpeciesEdit?: boolean;
    fromScreen?: string;
    isOnboarding?: boolean;
  };
  EditPet: { petId: number };
  ViewAllActivities: { petId: number };
  PetSpeciesPicker: {
    fromScreen?: string;
    isOnboarding?: boolean;
  };
  ActivityWizard: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  PetSpeciesPicker: {
    fromScreen?: string;
    isOnboarding?: boolean;
  };
  AddPet: {
    species?: string;
    allowSpeciesEdit?: boolean;
    fromScreen?: string;
    isOnboarding?: boolean;
  };
  Success: undefined;
};

export type ActivityStackParamList = {
  SelectType: {
    petId: number;
    category?: string;
    editActivity?: ActivityRecord;
    fromScreen?: string;
  };
  FillDetails: {
    petId: number;
    category: string;
    editActivity?: ActivityRecord;
    activityData?: any;
    fromScreen?: string;
  };
  SelectDateTime: {
    petId: number;
    category: string;
    editActivity?: ActivityRecord;
    activityData?: any;
    preselectedDate?: string;
    fromScreen?: string;
  };
  SetRepeat: {
    petId: number;
    category: string;
    editActivity?: ActivityRecord;
    activityData?: any;
    preselectedDate?: string;
    fromScreen?: string;
  };
  Confirmation: {
    petId: number;
    category: string;
    editActivity?: ActivityRecord;
    activityData?: any;
    preselectedDate?: string;
    fromScreen?: string;
  };
};

// --- Email Verification Component Types ---
export interface EmailVerificationCardProps {
  email: string;
  status: 'pending' | 'verified' | 'error';
  onResend: () => void;
  onCheck: () => void;
  isLoading?: boolean;
}

export interface VerificationStatusIndicatorProps {
  verified: boolean;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export interface EmailVerificationScreenProps {
  email: string;
  onVerificationComplete: () => void;
  onResendEmail: () => void;
  onBackToLogin: () => void;
}

export interface EmailVerificationPendingScreenProps {
  email: string;
  onBackToLogin: () => void;
  onResendEmail: () => void;
}

// Экспортируем API типы
export * from './api';
