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
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
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
    }
  }

  getUser() {
    return this.userSubject.value;
  }
}
