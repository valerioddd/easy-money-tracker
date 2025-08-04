import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ExpenseTestComponent } from './components/expense-test/expense-test.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'test', component: ExpenseTestComponent },
  { path: '**', redirectTo: '/login' }
];
