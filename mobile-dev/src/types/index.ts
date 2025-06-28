// User types
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Pet types
export type PetGender = 'Male' | 'Female';

export interface Pet {
  id: number;
  user_id: number;
  name: string;
  species: string;
  breed?: string;
  gender: PetGender;
  birthdate: string; // ISO date string
  weight: number;
  notes?: string;
}

export interface PetCreate {
  name: string;
  species: string;
  breed?: string;
  gender: PetGender;
  birthdate: string;
  weight: number;
  notes?: string;
}

export interface PetUpdate extends PetCreate {}

// Activity Record types
export type ActivityCategory = 'FEEDING' | 'HEALTH' | 'ACTIVITY';

export interface ActivityRecord {
  id: number;
  pet_id: number;
  category: ActivityCategory;
  title: string;
  date: string; // ISO datetime string
  time: string; // ISO datetime string
  repeat?: string;
  notes?: string;
  food_type?: string; // Only for feeding category
  quantity?: number; // Only for feeding category
}

export interface ActivityRecordCreate {
  pet_id: number;
  category: ActivityCategory;
  title: string;
  date: string;
  time: string;
  repeat?: string;
  notes?: string;
  food_type?: string;
  quantity?: number;
}

export interface ActivityRecordUpdate {
  title?: string;
  date?: string;
  time?: string;
  repeat?: string;
  notes?: string;
  food_type?: string;
  quantity?: number;
}

// AI Chat types
export interface ChatMessage {
  id: string;
  author?: string;
  content?: string;
  timestamp?: string;
  isUser: boolean;
}

export interface ChatSession {
  id: string;
  state?: any;
  create_time?: string;
  update_time?: string;
  event_count: number;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
}

export interface ChatResponse {
  response: string;
  session_id: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Chat: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  AddPet: undefined;
  Success: undefined;
};

export type ActivityStackParamList = {
  SelectType: { petId: number };
  FillDetails: { petId: number; category: ActivityCategory };
  SelectDateTime: { petId: number; category: ActivityCategory; activityData: any };
  SetRepeat: { petId: number; category: ActivityCategory; activityData: any };
  Confirmation: { petId: number; category: ActivityCategory; activityData: any };
};

// Form types
export interface PetFormData {
  name: string;
  species: string;
  breed: string;
  gender: PetGender;
  birthdate: Date;
  weight: string;
  notes: string;
}

export interface ActivityFormData {
  title: string;
  notes: string;
  food_type?: string;
  quantity?: string;
  duration?: string;
  weight?: string;
  temperature?: string;
}

export interface DateTimeData {
  date: Date;
  time: Date;
}

export interface RepeatData {
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  notifications: boolean;
}

// API Response types
export interface ApiError {
  detail: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: { [key: string]: string };
} 