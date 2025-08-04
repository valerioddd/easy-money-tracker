import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body text-center">
              <h2 class="card-title mb-4">Easy Money Tracker</h2>
              
              <!-- Se non è loggato -->
              <div *ngIf="!(user$ | async)" class="login-section">
                <p class="mb-4">Accedi con il tuo account Google per iniziare a tracciare le tue spese</p>
                <button 
                  class="btn btn-primary btn-lg"
                  (click)="signIn()"
                  [disabled]="isLoading">
                  <i class="fab fa-google me-2"></i>
                  <span *ngIf="!isLoading">Accedi con Google</span>
                  <span *ngIf="isLoading">Accesso in corso...</span>
                </button>
              </div>

              <!-- Se è loggato -->
              <div *ngIf="user$ | async as user" class="user-section">
                <img 
                  [src]="user.photoURL || ''" 
                  [alt]="user.displayName || ''"
                  class="rounded-circle mb-3"
                  width="80"
                  height="80">
                <h4>Ciao, {{ user.displayName }}!</h4>
                <p class="text-muted">{{ user.email }}</p>
                
                <div class="d-grid gap-2">
                  <a 
                    routerLink="/test" 
                    class="btn btn-primary">
                    <i class="fas fa-chart-line me-2"></i>
                    Test Google Sheets
                  </a>
                  <button 
                    class="btn btn-outline-danger"
                    (click)="signOut()">
                    Esci
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border: none;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .login-section {
      padding: 2rem 0;
    }
    
    .user-section {
      padding: 1rem 0;
    }
    
    .btn-lg {
      padding: 0.75rem 2rem;
      font-size: 1.1rem;
    }
  `]
})
export class LoginComponent {
  user$: Observable<User | null>;
  isLoading = false;

  constructor(private authService: AuthService) {
    this.user$ = this.authService.user$;
  }

  async signIn(): Promise<void> {
    this.isLoading = true;
    try {
      await this.authService.signInWithGoogle();
    } catch (error) {
      console.error('Errore durante il login:', error);
      // Qui potresti aggiungere un toast di errore
    } finally {
      this.isLoading = false;
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.authService.signOut();
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  }
}
