import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { faCloud, faMagicWandSparkles, faListCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // Font Awesome icons
  faCloud = faCloud;
  faMagicWandSparkles = faMagicWandSparkles;
  faListCheck = faListCheck;
  
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check if already logged in
    this.supabaseService.authState.subscribe(user => {
      if (user) {
        this.router.navigate(['/characters']);
      }
    });

    const user = this.supabaseService.getUser();
    console.log('Manually checking user:', user);

  }

  async signInWithGoogle(): Promise<void> {
    try {
      await this.supabaseService.signInWithGoogle();
      // Redirect will happen automatically via OAuth flow
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  }

  // async signInWithFB(): Promise<void> {
  //   try {
  //     await this.supabaseService.signInWithFacebook();
  //     // Redirect will happen automatically via OAuth flow
  //   } catch (error) {
  //     console.error('Error signing in with Facebook:', error);
  //   }
  // }
}
