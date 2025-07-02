import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Secure Token Storage Service
 * Uses Expo SecureStore for sensitive tokens and AsyncStorage for user data
 */
class TokenStorage {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  // 🔐 Access Token (stored securely)
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to set access token:', error);
      throw error;
    }
  }

  async removeAccessToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove access token:', error);
    }
  }

  // 🔐 Refresh Token (stored securely)
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to set refresh token:', error);
      throw error;
    }
  }

  async removeRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove refresh token:', error);
    }
  }

  // 👤 User Data (can use AsyncStorage for non-sensitive data)
  async getUser(): Promise<any | null> {
    try {
      const userString = await AsyncStorage.getItem(this.USER_KEY);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  async setUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to set user data:', error);
      throw error;
    }
  }

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Failed to remove user data:', error);
    }
  }

  // 🧹 Clear all auth data
  async clearAll(): Promise<void> {
    console.log('🧹 Clearing all auth data...');
    await Promise.all([
      this.removeAccessToken(),
      this.removeRefreshToken(),
      this.removeUser()
    ]);
  }

  // 🔍 Check if user has valid tokens
  async hasValidTokens(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    const refreshToken = await this.getRefreshToken();
    return !!(accessToken && refreshToken);
  }
}

export const tokenStorage = new TokenStorage();
export default tokenStorage; 