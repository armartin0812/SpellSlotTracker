import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CharacterListComponent } from './character-list/character-list.component';
import { AuthGuard } from './guards/auth.guard';
import { CallbackComponent } from './auth/callback/callback.component';

const routes: Routes = [
  { path: '', redirectTo: '/characters', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'characters', 
    component: CharacterListComponent,
    canActivate: [AuthGuard]
  },
  { path: 'auth/callback', component: CallbackComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
