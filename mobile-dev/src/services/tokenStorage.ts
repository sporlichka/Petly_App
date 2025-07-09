import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Secure Token Storage Service
 * Uses Expo SecureStore for sensitive tokens and AsyncStorage for user data
 */
class TokenStorage {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  // 🌐 Platform-specific secure storage methods
  private async getSecureItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`Failed to get secure item ${key}:`, error);
      return null;
    }
  }

  private async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Failed to set secure item ${key}:`, error);
      throw error;
    }
  }

  private async removeSecureItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Failed to remove secure item ${key}:`, error);
    }
  }

  // 🔐 Access Token (stored securely)
  async getAccessToken(): Promise<string | null> {
    return await this.getSecureItem(this.ACCESS_TOKEN_KEY);
  }

  async setAccessToken(token: string): Promise<void> {
    await this.setSecureItem(this.ACCESS_TOKEN_KEY, token);
  }

  async removeAccessToken(): Promise<void> {
    await this.removeSecureItem(this.ACCESS_TOKEN_KEY);
  }

  // 🔐 Refresh Token (stored securely)
  async getRefreshToken(): Promise<string | null> {
    return await this.getSecureItem(this.REFRESH_TOKEN_KEY);
  }

  async setRefreshToken(token: string): Promise<void> {
    await this.setSecureItem(this.REFRESH_TOKEN_KEY, String(token));
  }

  async removeRefreshToken(): Promise<void> {
    await this.removeSecureItem(this.REFRESH_TOKEN_KEY);
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