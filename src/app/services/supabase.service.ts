import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

// Custom storage provider that doesn't use LockManager
class CustomStorageProvider {
  private storage: Storage;

  constructor(storage: 'local' | 'session' = 'local') {
    this.storage = storage === 'local' ? localStorage : sessionStorage;
  }

  getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.storage.setItem(key, value);
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;
  private userSubject = new BehaviorSubject<User | null>(null);
  public authState = this.userSubject.asObservable(); // Named to match existing code

  constructor(private router: Router) {
    const customStorage = new CustomStorageProvider('local');
    
    this.supabase = createClient(
      environment.supabase_url,
      environment.supabase_key,
      {
        auth: {
          storage: customStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );

    // Check for existing session
    this.supabase.auth.getSession().then(({ data }) => {
      console.log('Initial session check:', data?.session?.user);
      this.userSubject.next(data.session?.user || null);
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user);
      this.userSubject.next(session?.user || null);
    });
  }

  async signInWithGoogle() {
    console.log('Initiating Google sign-in');
    console.log('Redirect URL:', `${window.location.origin}/auth/callback`);
    
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account' // Force Google to show the account selector
        }
      }
    });
    
    console.log('Sign-in initiated:', data);
    
    if (error) {
      console.error('Error initiating sign-in:', error);
      throw error;
    }
  }

  // async signInWithFacebook() {
  //   const { error } = await this.supabase.auth.signInWithOAuth({
  //     provider: 'facebook',
  //     options: {
  //       redirectTo: `${window.location.origin}/auth/callback`
  //     }
  //   });
    
  //   if (error) throw error;
  // }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this.router.navigate(['/login']);
  }

  async handleAuthCallback(): Promise<void> {
    console.log('Handling auth callback');
    
    // First, try to extract the hash fragment from the URL
    const hashFragment = window.location.hash;
    console.log('Hash fragment:', hashFragment);
    
    if (hashFragment && hashFragment.length > 0) {
      try {
        // Process the hash fragment manually if needed
        console.log('Processing hash fragment');
        
        // The Supabase client should handle this automatically,
        // but we'll explicitly call getSession to ensure it's processed
        const { data, error } = await this.supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session after processing hash:', error);
          throw error;
        }
        
        if (data?.session) {
          console.log('Session found after processing hash:', data.session.user);
          this.userSubject.next(data.session.user);
          return;
        }
      } catch (err) {
        console.error('Error processing hash fragment:', err);
      }
    }
    
    // If we didn't get a session from the hash, try getting it directly
    const { data, error } = await this.supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      throw error;
    }
    
    if (data?.session) {
      console.log('Session found:', data.session.user);
      this.userSubject.next(data.session.user);
    } else {
      console.log('No session found');
      
      // As a last resort, try to exchange the code for a session
      // This is needed for some OAuth providers
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (code) {
        console.log('Found code in URL, attempting to exchange for session');
        try {
          // This is handled automatically by Supabase, but we'll try to force it
          await this.supabase.auth.exchangeCodeForSession(code);
          
          // Check if we have a session now
          const { data: sessionData } = await this.supabase.auth.getSession();
          if (sessionData?.session) {
            console.log('Session obtained after code exchange:', sessionData.session.user);
            this.userSubject.next(sessionData.session.user);
          }
        } catch (err) {
          console.error('Error exchanging code for session:', err);
        }
      }
    }
  }

  getUser() {
    return this.userSubject.value;
  }
}
