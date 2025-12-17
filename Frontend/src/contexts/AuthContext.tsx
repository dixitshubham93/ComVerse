import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as loginApi, signup as signupApi } from '../api/authApi';

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string; // Maps to avatarUrl from backend
  age?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, age: number, avatar: string, banner?: string) => Promise<void>;
  setUserFromSignup: (userData: { id: number; username: string; email: string; avatar: string; age?: number }) => void;
  logout: () => void;
  loginWithGoogle: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('comverse_user');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Ensure id is a number
        if (parsedUser.id) {
          parsedUser.id = typeof parsedUser.id === 'string' ? parseInt(parsedUser.id, 10) : parsedUser.id;
        }
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('comverse_user');
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  // Check for Google OAuth redirect on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        const newUser: User = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          avatar: userData.avatarUrl || '',
          age: userData.age,
        };
        
        setUser(newUser);
        localStorage.setItem('comverse_user', JSON.stringify(newUser));
        localStorage.setItem('authToken', token);
        
        // Clean up URL
        window.history.replaceState({}, document.title, '/');
      } catch (e) {
        console.error('Failed to parse Google OAuth user data:', e);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await loginApi({ email, password });
      
      if (res.success && res.data) {
        const { token, user: userData } = res.data;
        
        const newUser: User = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          avatar: userData.avatarUrl || '',
          age: userData.age,
        };
        
        setUser(newUser);
        localStorage.setItem('comverse_user', JSON.stringify(newUser));
        localStorage.setItem('authToken', token);
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (username: string, email: string, password: string, age: number, avatar: string, banner?: string) => {
    // This is kept for backward compatibility but should use setUserFromSignup after API call
    throw new Error('Please use the signup API directly from AuthCard');
  };

  const setUserFromSignup = (userData: { id: number; username: string; email: string; avatar: string; age?: number }) => {
    const newUser: User = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar,
      age: userData.age,
    };
    
    setUser(newUser);
    localStorage.setItem('comverse_user', JSON.stringify(newUser));
  };

  const loginWithGoogle = () => {
    // Redirect to Google OAuth
    const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('comverse_user');
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      signup,
      setUserFromSignup,
      logout,
      loginWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

