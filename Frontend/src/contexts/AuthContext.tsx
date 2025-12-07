import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createUser, UserDto } from '../api/userApi';

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
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('comverse_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Ensure id is a number
        if (parsedUser.id) {
          parsedUser.id = typeof parsedUser.id === 'string' ? parseInt(parsedUser.id, 10) : parsedUser.id;
        }
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    // TODO: Replace with actual API call when auth is implemented
    // For now, simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock user data - replace with actual API response
    const mockUser: User = {
      id: 1,
      username: email.split('@')[0],
      email,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email,
    };
    
    setUser(mockUser);
    localStorage.setItem('comverse_user', JSON.stringify(mockUser));
  };

  const signup = async (username: string, email: string, password: string, age: number, avatar: string, banner?: string) => {
    try {
      // Note: User creation is handled by the auth API (signupApi) in AuthCard
      // This function is kept for backward compatibility but should not be used for new signups
      // Use setUserFromSignup instead to avoid double API calls
      
      const newUser: User = {
        id: 0, // This should be set from the backend response in AuthCard
        username,
        email,
        avatar: avatar,
        age: age || undefined,
      };
      
      setUser(newUser);
      localStorage.setItem('comverse_user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Failed to set user in context:', error);
      throw error;
    }
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

  const loginWithGoogle = async () => {
    // TODO: Replace with actual Google OAuth implementation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser: User = {
      id: Date.now(),
      username: 'Google User',
      email: 'user@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google',
    };
    
    setUser(mockUser);
    localStorage.setItem('comverse_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('comverse_user');
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

