import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './services/supabase.service';
import { User } from '@supabase/supabase-js';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Spell Slot Tracker';
  user: User | null = null;
  loggedIn: boolean = false;
  currentYear: number = new Date().getFullYear();
  faGithub = faGithub;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  ngOnInit() {
    this.supabaseService.authState.subscribe((user) => {
      this.user = user;
    });
  }

  signOut(): void {
    this.supabaseService.signOut();
  }
}
