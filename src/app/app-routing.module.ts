import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CharacterListComponent } from './character-list/character-list.component';
import { AuthGuard } from './guards/auth.guard';
import { CallbackComponent } from './auth/callback/callback.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

const routes: Routes = [
  { path: '', redirectTo: '/characters', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'characters', 
    component: CharacterListComponent,
    canActivate: [AuthGuard]
  },
  // The callback route should NOT have the AuthGuard
  { path: 'auth/callback', component: CallbackComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
  providers: [{provide: LocationStrategy, useClass: HashLocationStrategy}]
})
export class AppRoutingModule { }
