import {
  User,
  UserCreate,
  UserLogin,
  AuthResponse,
  FirebaseAuthResponse,
  EmailVerificationRequest,
  EmailVerificationResponse,
  EmailVerificationStatus,
  RefreshTokenRequest,
  RefreshTokenResponse,
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
  ApiError,
  AuthError,
  AuthErrorType
} from '../types';
import { 
  generateVirtualActivitiesForList, 
  VirtualActivityRecord,
  filterVirtualActivitiesByDate,
  filterVirtualActivitiesByDateRange
} from './virtualActivityService';
import { tokenStorage } from './tokenStorage';
import { identifyUser, trackEvent } from './mixpanelService';
import { parseAuthError, isVerificationError } from '../utils/authUtils';
import { API_ENDPOINTS } from '../constants/ApiConstants';

const API_BASE_URL = 'https://tabvetly.live';

class ApiService {
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;
  private readonly baseUrl = API_BASE_URL;

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await tokenStorage.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleUnauthorized(): Promise<void> {
    // Clear all auth data when unauthorized
    await tokenStorage.clearAll();
    console.log('🔑 Unauthorized - cleared all auth data');
  }

  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    
    this.refreshPromise = (async () => {
      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('🔄 Refreshing access token...');

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: refreshToken
          }),
        });

        if (!response.ok) {
          throw new Error(`Refresh failed: ${response.status}`);
        }

        const data: RefreshTokenResponse = await response.json();
        
        // Store new access token
        await tokenStorage.setAccessToken(data.access_token);
        
        // Store new refresh token if provided (token rotation)
        // If no new refresh token, keep the existing one
        if (data.refresh_token) {
          await tokenStorage.setRefreshToken(data.refresh_token);
        }
        // If refresh_token is null/undefined, we keep the existing refresh token

        console.log('✅ Token refreshed successfully');
        return data.access_token;

      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        await this.handleUnauthorized();
        throw new Error('Session expired. Please log in again.');
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Check if token is expiring soon and refresh proactively
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken && this.isTokenExpiringSoon(accessToken, 2)) { // 2 minute buffer
      console.log('🔄 Token expiring soon, refreshing proactively...');
      try {
        await this.refreshAccessToken();
      } catch (error) {
        console.log('⚠️ Proactive refresh failed, continuing with current token');
      }
    }

    // First attempt with current token
    let headers = await this.getAuthHeaders();
    
    // Если body это FormData, не устанавливаем Content-Type
    if (options.body instanceof FormData) {
      const { 'Content-Type': _, ...headersWithoutContentType } = headers;
      headers = headersWithoutContentType;
    }
    
    try {
      let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // If 401 and we have a refresh token, try to refresh
      if (response.status === 401) {
        const refreshToken = await tokenStorage.getRefreshToken();
        
        if (refreshToken && !this.isRefreshing) {
          try {
            console.log('🔄 Access token expired, attempting refresh...');
            
            // Refresh the token
            await this.refreshAccessToken();
            
            // Retry the original request with new token
            headers = await this.getAuthHeaders();
            
            // Если body это FormData, не устанавливаем Content-Type
            if (options.body instanceof FormData) {
              const { 'Content-Type': _, ...headersWithoutContentType } = headers;
              headers = headersWithoutContentType;
            }
            
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers: {
                ...headers,
                ...options.headers,
              },
            });

            console.log('✅ Request retried with new token');
            
          } catch (refreshError) {
            console.error('❌ Token refresh failed, logging out');
            throw new Error('Session expired. Please log in again.');
          }
        } else {
          // No refresh token or already refreshing, handle as unauthorized
          await this.handleUnauthorized();
          throw new Error('Authentication expired. Please log in again.');
        }
      }
      // Check if response is ok
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorData: any = null;
        
        try {
          // Try to parse as JSON first
          errorData = await response.json();
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
        
        // Создаем структурированную ошибку
        const error = {
          message: errorMessage,
          status: response.status,
          data: errorData
        };
        
        throw error;
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
  async login(credentials: UserLogin): Promise<FirebaseAuthResponse> {
    try {
      const response = await this.request<FirebaseAuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      // Проверяем, подтвержден ли email (только если поле существует)
      // Временно отключено, так как бэкенд также отключил эту проверку
      /*
      if (response.user.email_verified !== undefined && !response.user.email_verified) {
        const authError: AuthError = {
          type: AuthErrorType.EMAIL_NOT_VERIFIED,
          message: 'Email не подтвержден. Пожалуйста, подтвердите ваш email перед входом.',
        };
        throw authError;
      }
      */
      
      // Store both tokens securely
      await tokenStorage.setAccessToken(response.access_token);
      await tokenStorage.setRefreshToken(response.refresh_token);
      await tokenStorage.setUser(response.user);
      
      identifyUser(response.user.id.toString(), {
        "$name": response.user.username || response.user.email,
        "$email": response.user.email
      });
      
      // Track login event
      trackEvent("Sign In", {
        "Signup Type": "Email",
        "OS": "mobile"
      });
      
      console.log('🔑 Login successful - tokens stored securely');
      
      return response;
    } catch (error) {
      // Парсим ошибку для лучшей обработки
      const authError = parseAuthError(error);
      throw authError;
    }
  }

  async register(userData: UserCreate): Promise<FirebaseAuthResponse> {
    try {
      const response = await this.request<FirebaseAuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      // Store both tokens securely after registration
      await tokenStorage.setAccessToken(response.access_token);
      await tokenStorage.setRefreshToken(response.refresh_token);
      await tokenStorage.setUser(response.user);
      
      // Mixpanel identification
      identifyUser(response.user.id.toString(), {
        "$name": response.user.username || response.user.email,
        "$email": response.user.email
      });
      
      // Track registration event
      trackEvent("Sign Up", {
        "Signup Type": "Email",
        "OS": "mobile",
        "Email Verification Sent": true // Firebase всегда отправляет email
      });
      
      console.log('🔑 Registration successful - tokens stored and email verification sent');
      
      return response;
    } catch (error) {
      // Парсим ошибку для лучшей обработки
      const authError = parseAuthError(error);
      throw authError;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const user = await this.request<User>('/auth/me');
      
      // Mixpanel identification
      identifyUser(user.id.toString(), {
        "$name": user.username || user.email,
        "$email": user.email
      });
      
      return user;
    } catch (error) {
      const authError = parseAuthError(error);
      throw authError;
    }
  }

  async logout(): Promise<void> {
    try {
      // Try to revoke the refresh token on the server
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch (error) {
      console.log('⚠️ Failed to revoke token on server, clearing locally');
    }
    
    // Clear all local auth data
    await tokenStorage.clearAll();
    
    // Reset Mixpanel user
    // Note: resetUser function is available in mixpanelService if needed
    
    console.log('🔑 Logged out - all tokens cleared');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await this.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      
      console.log('🔑 Password changed successfully');
    } catch (error) {
      const authError = parseAuthError(error);
      throw authError;
    }
  }

  async deleteProfile(password: string): Promise<void> {
    await this.request('/auth/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({
        password: password,
        confirm_deletion: true
      })
    });
    // Clear stored data after successful deletion
    await tokenStorage.clearAll();
    console.log('🗑️ Profile deleted - all data cleared');
  }

  // Email verification methods
  async resendEmailVerification(): Promise<EmailVerificationResponse> {
    try {
      const response = await this.request<EmailVerificationResponse>('/auth/resend-verification', {
        method: 'POST',
      });
      
      console.log('📧 Email verification resent successfully');
      return response;
    } catch (error) {
      const authError = parseAuthError(error);
      throw authError;
    }
  }

  async checkEmailVerification(): Promise<EmailVerificationStatus> {
    try {
      // Получаем email текущего пользователя из хранилища
      const user = await tokenStorage.getUser();
      if (!user?.email) {
        throw new Error('No user email found');
      }

      return this.checkEmailVerificationByEmail(user.email);
    } catch (error) {
      const authError = parseAuthError(error);
      throw authError;
    }
  }

  async checkEmailVerificationByEmail(email: string): Promise<EmailVerificationStatus> {
    try {
      // Используем публичный эндпоинт без аутентификации
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.VERIFY_EMAIL_STATUS(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as EmailVerificationStatus;
      
      console.log(`📧 Email verification status for ${email}: ${data.email_verified ? 'verified' : 'not verified'}`);
      return data;
    } catch (error) {
      const authError = parseAuthError(error);
      throw authError;
    }
  }

  async verifyEmailWithToken(token: string): Promise<EmailVerificationResponse> {
    try {
      const response = await this.request<EmailVerificationResponse>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      
      console.log('✅ Email verified successfully');
      return response;
    } catch (error) {
      const authError = parseAuthError(error);
      throw authError;
    }
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

  // Activity Record endpoints (обновлено для новых полей)

  async getActivityRecords(
    petId: number,
    category?: string,
    skip = 0,
    limit = 100
  ): Promise<VirtualActivityRecord[]> {
    const params = new URLSearchParams({
      pet_id: petId.toString(),
      skip: skip.toString(),
      limit: limit.toString(),
    });
    if (category) {
      params.append('category', category.toUpperCase());
    }
    const activities = await this.request<ActivityRecord[]>(`/records/?${params.toString()}`);
    return generateVirtualActivitiesForList(activities);
  }

  async getAllUserActivityRecords(
    category?: string,
    skip = 0,
    limit = 1000
  ): Promise<VirtualActivityRecord[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    if (category) {
      params.append('category', category.toUpperCase());
    }
    const activities = await this.request<ActivityRecord[]>(`/records/all-user-pets?${params.toString()}`);
    return generateVirtualActivitiesForList(activities);
  }

  async getActivityRecordsByDate(
    date: string, // Format: YYYY-MM-DD
    category?: string
  ): Promise<VirtualActivityRecord[]> {
    const params = new URLSearchParams({ date });
    if (category) {
      params.append('category', category.toUpperCase());
    }
    const activities = await this.request<ActivityRecord[]>(`/records/by-date?${params.toString()}`);
    const virtualActivities = generateVirtualActivitiesForList(activities);
    return filterVirtualActivitiesByDate(virtualActivities, new Date(date));
  }

  async getActivityRecordsByDateRange(
    startDate: string, // Format: YYYY-MM-DD
    endDate: string,   // Format: YYYY-MM-DD
    category?: string,
    skip = 0,
    limit = 1000
  ): Promise<VirtualActivityRecord[]> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      skip: skip.toString(),
      limit: limit.toString(),
    });
    if (category) {
      params.append('category', category.toUpperCase());
    }
    const activities = await this.request<ActivityRecord[]>(`/records/by-date-range?${params.toString()}`);
    const virtualActivities = generateVirtualActivitiesForList(activities);
    return filterVirtualActivitiesByDateRange(virtualActivities, new Date(startDate), new Date(endDate));
  }

  async getActivityRecord(recordId: number): Promise<ActivityRecord> {
    return this.request<ActivityRecord>(`/records/${recordId}`);
  }

  async createActivityRecord(recordData: ActivityRecordCreate): Promise<ActivityRecord> {
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

  async disableAllNotifications(): Promise<void> {
    await this.request('/records/disable-all-notifications', {
      method: 'PATCH',
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

  private isTokenExpiringSoon(token: string, bufferMinutes: number = 5): boolean {
    try {
      // Check if token will expire within the buffer time
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const bufferSeconds = bufferMinutes * 60;
      return payload.exp < (currentTime + bufferSeconds);
    } catch (error) {
      // If we can't parse the token, consider it invalid
      return true;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    // Check if we have any tokens at all
    if (!(await tokenStorage.hasValidTokens())) {
      return false;
    }

    const accessToken = await tokenStorage.getAccessToken();
    if (!accessToken) {
      return false;
    }

    // Check if access token is expired or will expire soon (within 5 minutes)
    if (this.isTokenExpired(accessToken) || this.isTokenExpiringSoon(accessToken)) {
      console.log('🔑 Access token expired or expiring soon, trying refresh...');
      
      // Try to refresh the token
      try {
        await this.refreshAccessToken();
        return true;
      } catch (error) {
        console.log('🔑 Token refresh failed during auth check');
        return false;
      }
    }

    // Token appears valid - don't make unnecessary API calls
    return true;
  }

  async isEmailVerified(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user.email_verified || false;
    } catch (error) {
      console.log('🔑 Failed to check email verification status');
      return false;
    }
  }

  async getStoredUser(): Promise<User | null> {
    return await tokenStorage.getUser();
  }
}

export const apiService = new ApiService();
export default apiService;

// Export the new API structure
export const api = {
  auth: {
    login: (credentials: UserLogin) => apiService.login(credentials),
    register: (userData: UserCreate) => apiService.register(userData),
    logout: () => apiService.logout(),
    getCurrentUser: () => apiService.getCurrentUser(),
    changePassword: (currentPassword: string, newPassword: string) => 
      apiService.changePassword(currentPassword, newPassword),
    deleteProfile: (password: string) => apiService.deleteProfile(password),
    resendVerificationEmail: () => apiService.resendEmailVerification(),
    checkEmailVerification: () => apiService.checkEmailVerification(),
    checkEmailVerificationByEmail: (email: string) => apiService.checkEmailVerificationByEmail(email),
    verifyEmailToken: (token: string) => apiService.verifyEmailWithToken(token),
  },
  pets: {
    getAll: () => apiService.getPets(),
    create: (petData: PetCreate) => apiService.createPet(petData),
    update: (petId: number, petData: PetUpdate) => apiService.updatePet(petId, petData),
    delete: (petId: number) => apiService.deletePet(petId),
  },
  activities: {
    getAll: (petId: number, category?: string, skip?: number, limit?: number) => 
      apiService.getActivityRecords(petId, category, skip, limit),
    getAllUser: (category?: string, skip?: number, limit?: number) => 
      apiService.getAllUserActivityRecords(category, skip, limit),
    getByDate: (date: string, category?: string) => 
      apiService.getActivityRecordsByDate(date, category),
    getByDateRange: (startDate: string, endDate: string, category?: string, skip?: number, limit?: number) => 
      apiService.getActivityRecordsByDateRange(startDate, endDate, category, skip, limit),
    getById: (recordId: number) => apiService.getActivityRecord(recordId),
    create: (recordData: ActivityRecordCreate) => apiService.createActivityRecord(recordData),
    update: (recordId: number, recordData: ActivityRecordUpdate) => 
      apiService.updateActivityRecord(recordId, recordData),
    delete: (recordId: number) => apiService.deleteActivityRecord(recordId),
    disableAllNotifications: () => apiService.disableAllNotifications(),
  },
  chat: {
    sendMessage: (request: ChatRequest) => apiService.sendChatMessage(request),
    getSessions: () => apiService.getChatSessions(),
    getSessionMessages: (sessionId: string) => apiService.getChatSessionMessages(sessionId),
    deleteSession: (sessionId: string) => apiService.deleteChatSession(sessionId),
    clearSessionMessages: (sessionId: string) => apiService.clearChatSessionMessages(sessionId),
  },
  utils: {
    isAuthenticated: () => apiService.isAuthenticated(),
    isEmailVerified: () => apiService.isEmailVerified(),
    getStoredUser: () => apiService.getStoredUser(),
  },
}; 