import { postJson } from './emailApi';

export interface LoginRequest {
  emailOrNickname: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    username: string;
    email: string | null;
    emailVerified: boolean;
  };
}

/**
 * Login with email or nickname
 */
export const loginWithEmailOrNickname = async (emailOrNickname: string): Promise<LoginResponse['user']> => {
  try {
    const response = await postJson<LoginRequest, LoginResponse>(
      '/api/auth/login',
      { emailOrNickname }
    );

    if (!response.success || !response.user) {
      throw new Error(response.message || 'Login failed');
    }

    return response.user;
  } catch (error) {
    console.error('Failed to login:', error);
    throw error;
  }
};

export const authApi = {
  loginWithEmailOrNickname,
};





