import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ExpensesComponent } from './components/expenses/expenses';
import { CategoriesComponent } from './components/categories/categories.component';
import { ProfileComponent } from './components/profile/profile.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/expenses', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'expenses', component: ExpensesComponent, canActivate: [authGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'test', redirectTo: '/expenses' }, // Redirect per compatibilità
  { path: '**', redirectTo: '/expenses' }
];
