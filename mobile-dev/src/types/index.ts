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
  // Добавь другие поля по необходимости
}

export interface UserCreate {
  email: string;
  password: string;
  username?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
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
