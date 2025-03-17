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
    // The Supabase client will automatically handle the OAuth callback
    // We just need to redirect the user once authenticated
    this.supabaseService.authState.subscribe(user => {
      if (user) {
        this.router.navigate(['/characters']);
      }
    });
  }
}
