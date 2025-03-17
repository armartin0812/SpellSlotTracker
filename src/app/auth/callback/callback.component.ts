import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-callback',
  standalone: false,
  templateUrl: './callback.component.html'
})
export class CallbackComponent implements OnInit {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('Callback component initialized');
    console.log('URL:', window.location.href);
    
    // Check if we have a code or access_token in the URL
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    
    const hasCode = params.has('code');
    const hasToken = hashParams.has('access_token');
    
    console.log('Has code:', hasCode);
    console.log('Has token:', hasToken);
    
    // Actively process the OAuth callback
    this.supabaseService.handleAuthCallback().then(() => {
      // After processing, check if we have a user
      const user = this.supabaseService.getUser();
      console.log('User after callback processing:', user);
      
      if (user) {
        console.log('Navigating to characters page');
        this.router.navigate(['/characters']);
      } else {
        // If we have a code or token but no user, wait a bit and try again
        if ((hasCode || hasToken) && !user) {
          console.log('Has auth parameters but no user, waiting and trying again...');
          setTimeout(() => {
            const retryUser = this.supabaseService.getUser();
            if (retryUser) {
              console.log('User found after retry:', retryUser);
              this.router.navigate(['/characters']);
            } else {
              console.log('Still no user after retry, navigating to login');
              this.router.navigate(['/login']);
            }
          }, 2000); // Wait 2 seconds and try again
        } else {
          console.log('No user found, navigating to login');
          this.router.navigate(['/login']);
        }
      }
    }).catch(error => {
      console.error('Error handling auth callback:', error);
      this.router.navigate(['/login']);
    });
  }
}
