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
      // Call backend API to create user
      const userDto: UserDto = await createUser({
        username,
        email,
        password, // Will be ignored for now (no auth yet)
        avatarUrl: avatar,
        bannerUrl: banner,
        age,
      });

      // Map backend UserDto to frontend User interface
      const newUser: User = {
        id: userDto.id,
        username: userDto.username,
        email: userDto.email,
        avatar: userDto.avatarUrl || avatar,
        age: userDto.age || undefined,
      };
      
      setUser(newUser);
      localStorage.setItem('comverse_user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error; // Re-throw to let the component handle the error
    }
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

