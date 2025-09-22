import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthServiceClass {
  private supabase: any = null;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase environment variables not found');
      }

      this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });

      this.isInitialized = true;
      console.log('Auth service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      throw error;
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  async signUp(email: string, password: string) {
    await this.ensureInitialized();
    
    console.log('Starting signup process for:', email);
    
    // Check if we have proper Supabase configuration
    console.log('Supabase URL configured:', !!process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log('Supabase Anon Key configured:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Signup error:', error);
      console.error('Full signup error details:', JSON.stringify(error, null, 2));
      throw new Error(error.message);
    }

    console.log('Signup result:', {
      user: data.user ? { id: data.user.id, email: data.user.email, confirmed: data.user.email_confirmed_at } : null,
      session: data.session ? 'exists' : 'null'
    });
    console.log('Full signup response:', JSON.stringify(data, null, 2));

    return data;
  }

  async signIn(email: string, password: string) {
    await this.ensureInitialized();
    
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async sendEmailOtp(email: string) {
    await this.ensureInitialized();
    
    const { data, error } = await this.supabase.auth.resend({
      'type': 'signup',
      email,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async verifyEmailOtp(email: string, token: string) {
    await this.ensureInitialized();
    
    const { data, error } = await this.supabase.auth.verifyOtp({
      email,
      token,
      'type': 'signup',
    });

    if (error) {
      throw new Error(error.message);
    }

    // Force refresh the session to get updated user data
    await this.supabase.auth.refreshSession();
    
    return data;
  }

  async signOut() {
    await this.ensureInitialized();
    
    const { error } = await this.supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
  }

  async resetPassword(email: string) {
    await this.ensureInitialized();
    
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw new Error(error.message);
    }
  }

  async updatePassword(newPassword: string) {
    await this.ensureInitialized();
    
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateEmail(newEmail: string) {
    await this.ensureInitialized();
    
    const { error } = await this.supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async getCurrentUser() {
    await this.ensureInitialized();
    
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async getSession() {
    await this.ensureInitialized();
    
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!this.supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    
    return this.supabase.auth.onAuthStateChange(callback);
  }
}

export const AuthService = new AuthServiceClass();