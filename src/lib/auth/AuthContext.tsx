'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError, getClientErrorDetail, getErrorHttpStatus } from '../api-client';
import { getErrorMessage } from '../types/errors';
import { logger } from "@/lib/utils/logger";

/**
 * User interface
 */
interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

/**
 * Auth Context interface
 */
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  roles: string[];
  login: (_emailOrPhone: string, _password: string) => Promise<void>;
  register: (_data: RegisterData) => Promise<void>;
  logout: () => void;
}

/**
 * Register data interface
 */
interface RegisterData {
  email?: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Auth response from API
 */
interface AuthResponse {
  user: User;
  token: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

/**
 * Auth Provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load auth state from localStorage on mount
  useEffect(() => {
    logger.devLog('🔐 [AUTH] Loading auth state from localStorage...');
    
    const loadAuthState = async () => {
      try {
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
        const storedUser = localStorage.getItem(AUTH_USER_KEY);

        if (storedToken && storedUser) {
          logger.devLog('✅ [AUTH] Found stored auth data');
          const parsedUser = JSON.parse(storedUser);
          
          // If user doesn't have roles, fetch from API
          if (!parsedUser.roles || !Array.isArray(parsedUser.roles)) {
            logger.devLog('⚠️ [AUTH] User data missing roles, fetching from API...');
            try {
              const profileData = await apiClient.get<{ roles: string[] }>('/api/v1/users/profile');
              if (profileData.roles) {
                parsedUser.roles = profileData.roles;
                localStorage.setItem(AUTH_USER_KEY, JSON.stringify(parsedUser));
                logger.devLog('✅ [AUTH] Roles updated from API:', profileData.roles);
              }
            } catch (fetchError) {
              console.error('❌ [AUTH] Failed to fetch user roles:', fetchError);
            }
          }
          
          setToken(storedToken);
          setUser(parsedUser);
        } else {
          logger.devLog('ℹ️ [AUTH] No stored auth data found');
        }
      } catch (error) {
        console.error('❌ [AUTH] Error loading auth state:', error);
        // Clear corrupted data
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  /**
   * Login user
   */
  const login = async (emailOrPhone: string, password: string) => {
    logger.devLog('🔐 [AUTH] Login attempt:', { emailOrPhone: emailOrPhone ? 'provided' : 'not provided', password: password ? 'provided' : 'not provided' });
    
    try {
      setIsLoading(true);

      // Determine if it's email or phone
      const isEmail = emailOrPhone.includes('@');
      const requestData = isEmail
        ? { email: emailOrPhone, password }
        : { phone: emailOrPhone, password };

      logger.devLog('📤 [AUTH] Sending login request to API...');
      const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', requestData, {
        skipAuth: true, // Don't send token for login
      });

      logger.devLog('✅ [AUTH] Login successful:', { 
        userId: response.user.id,
        roles: response.user.roles,
        isAdmin: response.user.roles?.includes('admin')
      });

      // Store auth data
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));

      setToken(response.token);
      setUser(response.user);

      // Trigger auth update event
      window.dispatchEvent(new Event('auth-updated'));

      // Don't redirect here - let the login page handle redirect based on query params
    } catch (error: unknown) {
      console.error('❌ [AUTH] Login error:', error);

      let errorMessage = 'Login failed. Please try again.';

      if (error instanceof ApiError) {
        if (error.status === 401) {
          errorMessage = error.message || 'Invalid email/phone or password';
        } else if (error.status === 403) {
          errorMessage = error.message || 'Your account has been blocked';
        } else if (error.status === 400) {
          errorMessage = error.message || 'Please provide email/phone and password';
        } else {
          errorMessage = error.message || errorMessage;
        }
      } else {
        const status = getErrorHttpStatus(error);
        const msg = getErrorMessage(error);
        if (status === 401) {
          errorMessage = msg || 'Invalid email/phone or password';
        } else if (status === 403) {
          errorMessage = msg || 'Your account has been blocked';
        } else if (status === 400) {
          errorMessage = msg || 'Please provide email/phone and password';
        } else if (msg) {
          errorMessage = msg;
        }
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (data: RegisterData) => {
    logger.devLog('🔐 [AUTH] Registration attempt:', { 
      email: data.email || 'not provided',
      phone: data.phone || 'not provided',
      hasFirstName: !!data.firstName,
      hasLastName: !!data.lastName
    });

    try {
      setIsLoading(true);

      logger.devLog('📤 [AUTH] Sending registration request to API...', { data });
      const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', data, {
        skipAuth: true, // Don't send token for registration
      });

      logger.devLog('✅ [AUTH] Registration response received:', response);

      if (!response || !response.user || !response.token) {
        console.error('❌ [AUTH] Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      logger.devLog('✅ [AUTH] Registration successful:', { userId: response.user.id });

      // Store auth data
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, response.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
        logger.devLog('💾 [AUTH] Auth data stored in localStorage');
      } catch (storageError) {
        console.error('❌ [AUTH] Failed to store auth data:', storageError);
        throw new Error('Failed to save authentication data');
      }

      setToken(response.token);
      setUser(response.user);

      // Trigger auth update event
      window.dispatchEvent(new Event('auth-updated'));

      logger.devLog('🔄 [AUTH] Redirecting to home page...');
      // Redirect to home page
      router.push('/');
    } catch (error: unknown) {
      console.error('❌ [AUTH] Registration error:', error);
      if (error instanceof Error) {
        console.error('❌ [AUTH] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }

      let errorMessage = 'Registration failed. Please try again.';

      if (error instanceof ApiError) {
        const fromApi = getClientErrorDetail(error);
        errorMessage = fromApi ?? error.message;
      } else {
        const errorText = getErrorMessage(error);
        if (errorText.includes('409') || errorText.includes('already exists') || errorText.includes('User already exists')) {
          errorMessage = 'User with this email or phone already exists';
        } else if (errorText.includes('400') || errorText.includes('Validation failed')) {
          if (errorText.includes('password') || errorText.includes('Password')) {
            errorMessage = 'Password must be at least 6 characters';
          } else if (errorText.includes('email') || errorText.includes('phone')) {
            errorMessage = 'Please provide email or phone and password';
          } else {
            errorMessage = 'Invalid registration data. Please check your input.';
          }
        } else if (errorText.includes('500') || errorText.includes('Internal Server Error')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (errorText.includes('Failed to parse')) {
          errorMessage = 'Invalid response from server. Please try again.';
        } else {
          const match = errorText.match(/detail[:\s]+([^,\n]+)/i);
          if (match) {
            errorMessage = match[1].trim();
          } else if (errorText && errorText !== 'Unknown error') {
            errorMessage = errorText;
          }
        }
      }

      console.error('❌ [AUTH] Final error message:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    logger.devLog('🔐 [AUTH] Logging out...');
    
    // Clear auth data
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);

    setToken(null);
    setUser(null);

    // Trigger auth update event
    window.dispatchEvent(new Event('auth-updated'));

    // Redirect to home page
    router.push('/');
  };

  // Calculate roles and admin status
  const roles = user && Array.isArray(user.roles) ? user.roles : [];
  const isAdmin = roles.includes('admin');
  
  // Debug logging and ensure roles are loaded
  useEffect(() => {
    if (user && token) {
      const userRoles = Array.isArray(user.roles) ? user.roles : [];
      const userIsAdmin = userRoles.includes('admin');
      
      logger.devLog('🔍 [AUTH] User state updated:', {
        userId: user.id,
        roles: user.roles,
        rolesArray: userRoles,
        isAdmin: userIsAdmin,
        rolesType: typeof user.roles,
        rolesIsArray: Array.isArray(user.roles)
      });
      
      // If user doesn't have roles, fetch from API
      if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
        logger.devLog('⚠️ [AUTH] User missing roles, fetching from API...');
        apiClient.get<{ roles: string[] }>('/api/v1/users/profile')
          .then(profileData => {
            if (profileData.roles && Array.isArray(profileData.roles)) {
              const updatedUser = { ...user, roles: profileData.roles };
              setUser(updatedUser);
              localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
              logger.devLog('✅ [AUTH] Roles updated from API:', profileData.roles);
            }
          })
          .catch(error => {
            console.error('❌ [AUTH] Failed to fetch user roles:', error);
          });
      }
    }
  }, [user, token]);

  const value: AuthContextType = {
    user,
    token,
    isLoggedIn: !!token && !!user,
    isLoading,
    isAdmin,
    roles,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

