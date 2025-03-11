
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  username?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Define a type for the profile data to avoid type errors
interface ProfileData {
  id: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // 1. Fetch the initial session (important for page reloads)
    async function fetchSession() {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!mounted) return

      if (error) {
        console.error('Error retrieving session', error)
      }

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false) // <--- Don’t forget to flip off loading
    }

    fetchSession()

    // 2. Listen for auth changes (login, logout, token refresh, etc.)
    const {
      data: subscription,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false) // <--- Also ensure we stop loading here
    })

    // 3. Cleanup the subscription on unmount
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }

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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }

      toast.success('Account created! Please check your email for verification.');
      navigate('/auth');
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
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut }}>
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
