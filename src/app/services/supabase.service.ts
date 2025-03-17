import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private userSubject = new BehaviorSubject<User | null>(null);
  public authState = this.userSubject.asObservable(); // Named to match existing code

  constructor(private router: Router) {
    this.supabase = createClient(
      environment.supabase_url,
      environment.supabase_key
    );

    // Check for existing session
    this.supabase.auth.getSession().then(({ data }) => {
      this.userSubject.next(data.session?.user || null);
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
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

  getUser() {
    return this.userSubject.value;
  }
}
