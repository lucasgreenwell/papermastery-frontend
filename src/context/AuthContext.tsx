
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// This is a mock authentication context
// In a real app, this would connect to Supabase

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Mock implementation - would be replaced with actual Supabase Auth
  useEffect(() => {
    // Check if user is already signed in (e.g., from localStorage)
    const checkUser = async () => {
      try {
        const storedUser = localStorage.getItem('insight_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Mock login - would use Supabase Auth's signIn
      const mockUser = { id: '123', email };
      setUser(mockUser);
      localStorage.setItem('insight_user', JSON.stringify(mockUser));
      navigate('/dashboard');
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    try {
      // Mock signup - would use Supabase Auth's signUp
      const mockUser = { id: '123', email, name };
      setUser(mockUser);
      localStorage.setItem('insight_user', JSON.stringify(mockUser));
      navigate('/dashboard');
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    
    try {
      // Mock signout - would use Supabase Auth's signOut
      setUser(null);
      localStorage.removeItem('insight_user');
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
