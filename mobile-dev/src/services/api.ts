import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  UserCreate,
  UserLogin,
  AuthResponse,
  Pet,
  PetCreate,
  PetUpdate,
  ActivityRecord,
  ActivityRecordCreate,
  ActivityRecordUpdate,
  ChatRequest,
  ChatResponse,
  ChatSession,
  ChatMessage,
  ApiError
} from '../types';

const API_BASE_URL = 'http://134.112.56.39:8000'; // Your backend IP address

class ApiService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleUnauthorized(): Promise<void> {
    // Clear expired token and user data
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user');
    console.log('🔑 Token expired - cleared from storage');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (response.status === 401) {
        // Handle token expiration
        await this.handleUnauthorized();
        throw new Error('Authentication expired. Please log in again.');
      }
      // Check if response is ok
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          // Try to parse as JSON first
          const errorData: ApiError = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, try to get text response
          try {
            const textResponse = await response.text();
            console.error('Non-JSON error response:', textResponse);
            errorMessage = `${errorMessage}. Response: ${textResponse.substring(0, 200)}...`;
          } catch (textError) {
            console.error('Failed to read error response:', textError);
          }
        }
        
        throw new Error(errorMessage);
      }

      // Try to parse successful response as JSON
      try {
        return await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        const textResponse = await response.text();
        console.error('Response text:', textResponse);
        throw new Error(`Invalid JSON response. Response: ${textResponse.substring(0, 200)}...`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('API request failed:', {
          endpoint,
          error: error.message,
          type: error.name
        });
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Auth endpoints
  async login(credentials: UserLogin): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token for future requests
    await AsyncStorage.setItem('access_token', response.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));
    console.log('🔑 New token stored successfully');
    
    return response;
  }

  async register(userData: UserCreate): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user');
    console.log('🔑 Logged out - tokens cleared');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  async deleteProfile(): Promise<void> {
    await this.request('/auth/delete-profile', {
      method: 'DELETE',
    });
    // Clear stored data after successful deletion
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user');
  }

  // Pet endpoints
  async getPets(): Promise<Pet[]> {
    return this.request<Pet[]>('/pets/');
  }

  async createPet(petData: PetCreate): Promise<Pet> {
    return this.request<Pet>('/pets/', {
      method: 'POST',
      body: JSON.stringify(petData),
    });
  }

  async updatePet(petId: number, petData: PetUpdate): Promise<Pet> {
    return this.request<Pet>(`/pets/${petId}`, {
      method: 'PUT',
      body: JSON.stringify(petData),
    });
  }

  async deletePet(petId: number): Promise<void> {
    await this.request(`/pets/${petId}`, {
      method: 'DELETE',
    });
  }

  // Activity Record endpoints
  async getActivityRecords(
    petId: number,
    category?: string,
    skip = 0,
    limit = 100
  ): Promise<ActivityRecord[]> {
    const params = new URLSearchParams({
      pet_id: petId.toString(),
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (category) {
      // Backend expects uppercase categories
      params.append('category', category.toUpperCase());
    }

    const records = await this.request<ActivityRecord[]>(`/records/?${params.toString()}`);
    
    // Categories should already be uppercase from backend
    return records;
  }

  async getAllUserActivityRecords(
    category?: string,
    skip = 0,
    limit = 1000
  ): Promise<ActivityRecord[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (category) {
      params.append('category', category.toUpperCase());
    }

    const records = await this.request<ActivityRecord[]>(`/records/all-user-pets?${params.toString()}`);
    return records;
  }

  async getActivityRecordsByDate(
    date: string, // Format: YYYY-MM-DD
    category?: string
  ): Promise<ActivityRecord[]> {
    const params = new URLSearchParams({
      date: date,
    });
    
    if (category) {
      params.append('category', category.toUpperCase());
    }

    const records = await this.request<ActivityRecord[]>(`/records/by-date?${params.toString()}`);
    return records;
  }

  async getActivityRecordsByDateRange(
    startDate: string, // Format: YYYY-MM-DD
    endDate: string,   // Format: YYYY-MM-DD
    category?: string,
    skip = 0,
    limit = 1000
  ): Promise<ActivityRecord[]> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (category) {
      params.append('category', category.toUpperCase());
    }

    const records = await this.request<ActivityRecord[]>(`/records/by-date-range?${params.toString()}`);
    return records;
  }

  async getActivityRecord(recordId: number): Promise<ActivityRecord> {
    const record = await this.request<ActivityRecord>(`/records/${recordId}`);
    
    // Categories should already be uppercase from backend
    return record;
  }

  async createActivityRecord(recordData: ActivityRecordCreate): Promise<ActivityRecord> {
    // Backend expects uppercase categories, so send data as-is
    console.log('Creating activity record:', recordData);
    
    return this.request<ActivityRecord>('/records/', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  async updateActivityRecord(
    recordId: number,
    recordData: ActivityRecordUpdate
  ): Promise<ActivityRecord> {
    return this.request<ActivityRecord>(`/records/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify(recordData),
    });
  }

  async deleteActivityRecord(recordId: number): Promise<void> {
    await this.request(`/records/${recordId}`, {
      method: 'DELETE',
    });
  }

  // AI Chat endpoints
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/ai/assist', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getChatSessions(): Promise<ChatSession[]> {
    return this.request<ChatSession[]>('/ai/sessions');
  }

  async getChatSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const response = await this.request<any[]>(`/ai/sessions/${sessionId}/messages`);
    
    // Convert backend format to our ChatMessage format
    return response.map((event, index) => ({
      id: event.id || index.toString(),
      author: event.author,
      content: event.content,
      timestamp: event.timestamp,
      isUser: event.author === 'user' || event.author === 'human', // Check for user/human author
    }));
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    await this.request(`/ai/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async clearChatSessionMessages(sessionId: string): Promise<void> {
    await this.request(`/ai/sessions/${sessionId}/messages`, {
      method: 'DELETE',
    });
  }

  // Utility methods
  private isTokenExpired(token: string): boolean {
    try {
      // Simple JWT token expiration check without verification
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      // If we can't parse the token, consider it invalid
      return true;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      return false;
    }

    // First check if token is expired without making API call
    if (this.isTokenExpired(token)) {
      console.log('🔑 Token is expired, clearing...');
      await this.handleUnauthorized();
      return false;
    }

    // Token appears valid, but let's verify with a quick API call
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      console.log('🔑 Token validation failed:', error);
      // Token is invalid or expired, clear it
      await this.handleUnauthorized();
      return false;
    }
  }

  async getStoredUser(): Promise<User | null> {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  }
}

export const apiService = new ApiService();
export default apiService; 