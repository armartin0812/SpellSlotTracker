import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-callback',
  standalone: false,
  template: '<div class="d-flex justify-content-center align-items-center" style="height: 100vh;"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>',
})
export class CallbackComponent implements OnInit {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('Callback component initialized');
    
    // Actively process the OAuth callback
    this.supabaseService.handleAuthCallback().then(() => {
      // After processing, check if we have a user
      const user = this.supabaseService.getUser();
      console.log('User after callback processing:', user);
      
      if (user) {
        console.log('Navigating to characters page');
        this.router.navigate(['/characters']);
      } else {
        console.log('No user found, navigating to login');
        this.router.navigate(['/login']);
      }
    }).catch(error => {
      console.error('Error handling auth callback:', error);
      this.router.navigate(['/login']);
    });
  }
}
