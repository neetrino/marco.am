'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError, getClientErrorDetail, getErrorHttpStatus } from '../api-client';
import { getErrorMessage } from '../types/errors';
import { logger } from "@/lib/utils/logger";
import { getStoredLanguage } from '../language';
import {
  addPendingWishlistProductIfAny,
  invalidateWishlistCache,
} from '../wishlist/wishlist-client';
import { syncGuestDataAfterAuth } from './sync-guest-data-after-auth';

/** Session storage keys for OTP step (same-tab only). */
export const AUTH_VERIFICATION_TOKEN_KEY = 'auth_verification_token';
export const AUTH_VERIFICATION_CHANNEL_KEY = 'auth_verification_channel';

interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

interface RegisterData {
  email?: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export type AuthFlowResult =
  | { status: 'authenticated' }
  | { status: 'needs_verification' };

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  roles: string[];
  login: (_emailOrPhone: string, _password: string) => Promise<AuthFlowResult>;
  register: (_data: RegisterData) => Promise<AuthFlowResult>;
  completeVerification: (
    _code: string,
    _redirectTo?: string,
    _pendingWishlistProductId?: string | null
  ) => Promise<void>;
  resendVerificationCode: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

function isPendingVerification(
  x: unknown
): x is { needsVerification: true; channel: 'email' | 'phone'; verificationToken: string } {
  return (
    typeof x === 'object' &&
    x !== null &&
    'needsVerification' in x &&
    (x as { needsVerification?: boolean }).needsVerification === true &&
    typeof (x as { verificationToken?: string }).verificationToken === 'string' &&
    ((x as { channel?: string }).channel === 'email' ||
      (x as { channel?: string }).channel === 'phone')
  );
}

function isAuthSuccess(x: unknown): x is AuthResponse {
  return (
    typeof x === 'object' &&
    x !== null &&
    'token' in x &&
    'user' in x &&
    typeof (x as AuthResponse).token === 'string'
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const persistSession = (response: AuthResponse) => {
    localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
    window.dispatchEvent(new Event('auth-updated'));
  };

  const clearVerificationSession = () => {
    try {
      sessionStorage.removeItem(AUTH_VERIFICATION_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_VERIFICATION_CHANNEL_KEY);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    logger.devLog('🔐 [AUTH] Loading auth state from localStorage...');

    const loadAuthState = async () => {
      try {
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
        const storedUser = localStorage.getItem(AUTH_USER_KEY);

        if (storedToken && storedUser) {
          logger.devLog('✅ [AUTH] Found stored auth data');
          const parsedUser = JSON.parse(storedUser) as User;

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
              logger.devLog('❌ [AUTH] Failed to fetch user roles', { fetchError });
            }
          }

          setToken(storedToken);
          setUser(parsedUser);
        } else {
          logger.devLog('ℹ️ [AUTH] No stored auth data found');
        }
      } catch (error) {
        logger.devLog('❌ [AUTH] Error loading auth state', { error });
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = async (emailOrPhone: string, password: string): Promise<AuthFlowResult> => {
    logger.devLog('🔐 [AUTH] Login attempt:', {
      emailOrPhone: emailOrPhone ? 'provided' : 'not provided',
      password: password ? 'provided' : 'not provided',
    });

    try {
      setIsLoading(true);

      const isEmail = emailOrPhone.includes('@');
      const requestData = isEmail
        ? { email: emailOrPhone, password }
        : { phone: emailOrPhone, password };

      logger.devLog('📤 [AUTH] Sending login request to API...');
      const response = await apiClient.post<unknown>(
        '/api/v1/auth/login',
        requestData,
        { skipAuth: true }
      );

      if (isPendingVerification(response)) {
        sessionStorage.setItem(AUTH_VERIFICATION_TOKEN_KEY, response.verificationToken);
        sessionStorage.setItem(AUTH_VERIFICATION_CHANNEL_KEY, response.channel);
        return { status: 'needs_verification' };
      }

      if (!isAuthSuccess(response)) {
        throw new Error('Invalid response from server');
      }

      logger.devLog('✅ [AUTH] Login successful:', { userId: response.user.id });
      persistSession(response);
      await syncGuestDataAfterAuth();
      return { status: 'authenticated' };
    } catch (error: unknown) {
      logger.devLog('❌ [AUTH] Login error', { error });

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

  const register = async (data: RegisterData): Promise<AuthFlowResult> => {
    logger.devLog('🔐 [AUTH] Registration attempt:', {
      email: data.email || 'not provided',
      phone: data.phone || 'not provided',
      hasFirstName: !!data.firstName,
      hasLastName: !!data.lastName,
    });

    try {
      setIsLoading(true);

      logger.devLog('📤 [AUTH] Sending registration request to API...', { data });
      const response = await apiClient.post<unknown>(
        '/api/v1/auth/register',
        data,
        { skipAuth: true }
      );

      if (isPendingVerification(response)) {
        sessionStorage.setItem(AUTH_VERIFICATION_TOKEN_KEY, response.verificationToken);
        sessionStorage.setItem(AUTH_VERIFICATION_CHANNEL_KEY, response.channel);
        return { status: 'needs_verification' };
      }

      if (!isAuthSuccess(response)) {
        throw new Error('Invalid response from server');
      }

      logger.devLog('✅ [AUTH] Registration successful:', { userId: response.user.id });

      try {
        persistSession(response);
        await syncGuestDataAfterAuth();
        logger.devLog('💾 [AUTH] Auth data stored in localStorage');
      } catch (storageError) {
        logger.devLog('❌ [AUTH] Failed to store auth data', { storageError });
        throw new Error('Failed to save authentication data');
      }

      return { status: 'authenticated' };
    } catch (error: unknown) {
      logger.devLog('❌ [AUTH] Registration error', { error });

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

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const completeVerification = async (
    code: string,
    redirectTo = '/',
    pendingWishlistProductId?: string | null
  ) => {
    const verificationToken = sessionStorage.getItem(AUTH_VERIFICATION_TOKEN_KEY);
    if (!verificationToken) {
      throw new Error('Verification session expired. Please sign in again.');
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post<unknown>(
        '/api/v1/auth/verify',
        { verificationToken, code: code.trim() },
        { skipAuth: true }
      );

      if (!isAuthSuccess(response)) {
        throw new Error('Invalid response from server');
      }

      persistSession(response);
      clearVerificationSession();
      await syncGuestDataAfterAuth();
      const lang = getStoredLanguage();
      await addPendingWishlistProductIfAny(pendingWishlistProductId, lang);
      router.push(redirectTo);
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    const verificationToken = sessionStorage.getItem(AUTH_VERIFICATION_TOKEN_KEY);
    if (!verificationToken) {
      throw new Error('Verification session expired. Please sign in again.');
    }

    await apiClient.post(
      '/api/v1/auth/resend-verification',
      { verificationToken },
      { skipAuth: true }
    );
  };

  const logout = () => {
    logger.devLog('🔐 [AUTH] Logging out...');

    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    clearVerificationSession();

    setToken(null);
    setUser(null);

    invalidateWishlistCache();
    window.dispatchEvent(new Event('auth-updated'));

    router.push('/');
  };

  const roles = user && Array.isArray(user.roles) ? user.roles : [];
  const isAdmin = roles.includes('admin');

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
        rolesIsArray: Array.isArray(user.roles),
      });

      if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
        logger.devLog('⚠️ [AUTH] User missing roles, fetching from API...');
        apiClient.get<{ roles: string[] }>('/api/v1/users/profile')
          .then((profileData) => {
            if (profileData.roles && Array.isArray(profileData.roles)) {
              const updatedUser = { ...user, roles: profileData.roles };
              setUser(updatedUser);
              localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
              logger.devLog('✅ [AUTH] Roles updated from API:', profileData.roles);
            }
          })
          .catch((error) => {
            logger.devLog('❌ [AUTH] Failed to fetch user roles', { error });
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
    completeVerification,
    resendVerificationCode,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
