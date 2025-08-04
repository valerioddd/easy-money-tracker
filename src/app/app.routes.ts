import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ExpensesComponent } from './components/expenses/expenses';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'expenses', component: ExpensesComponent },
  { path: 'test', redirectTo: '/expenses' }, // Redirect per compatibilità
  { path: '**', redirectTo: '/login' }
];
