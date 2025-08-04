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
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
          
          <!-- Se non è loggato -->
          <div *ngIf="!(user$ | async)" class="login-card fade-in">
            <div class="welcome-section text-center mb-4">
              <div class="app-icon mb-3">
                <i class="fas fa-piggy-bank"></i>
              </div>
              <h2 class="welcome-title">Benvenuto!</h2>
              <p class="welcome-subtitle">Traccia le tue spese in modo semplice e veloce</p>
            </div>
            
            <div class="features-list mb-4">
              <div class="feature-item">
                <i class="fas fa-sync text-success me-3"></i>
                <span>Sincronizzazione automatica con Google Sheets</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-mobile-alt text-success me-3"></i>
                <span>Ottimizzato per smartphone</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-shield-alt text-success me-3"></i>
                <span>Accesso sicuro con Google</span>
              </div>
            </div>
            
            <button 
              class="btn btn-google btn-lg w-100"
              (click)="signIn()"
              [disabled]="isLoading">
              <div class="btn-content">
                <i class="fab fa-google me-3"></i>
                <span *ngIf="!isLoading">Accedi con Google</span>
                <span *ngIf="isLoading">
                  <i class="fas fa-spinner fa-spin me-2"></i>
                  Accesso in corso...
                </span>
              </div>
            </button>
          </div>

          <!-- Se è loggato -->
          <div *ngIf="user$ | async as user" class="user-card fade-in">
            <div class="user-header text-center">
              <img 
                [src]="user.photoURL || ''" 
                [alt]="user.displayName || ''"
                class="user-avatar mb-3">
              <h3 class="user-name">Ciao, {{ (user.displayName || 'Utente').split(' ')[0] }}! 👋</h3>
              <p class="user-email">{{ user.email }}</p>
            </div>
            
            <div class="action-buttons">
              <a 
                routerLink="/expenses" 
                class="btn btn-success btn-lg w-100 mb-3">
                <i class="fas fa-plus-circle me-2"></i>
                Inizia a tracciare le spese
              </a>
              
              <button 
                class="btn btn-outline-success w-100"
                (click)="signOut()">
                <i class="fas fa-sign-out-alt me-2"></i>
                Esci
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-card, .user-card {
      background: white;
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      padding: 2rem;
      margin: 1rem;
    }
    
    .app-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary-color), #20c997);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      box-shadow: 0 8px 16px rgba(25, 135, 84, 0.3);
    }
    
    .app-icon i {
      font-size: 2.5rem;
      color: white;
    }
    
    .welcome-title {
      color: var(--dark-color);
      font-weight: 700;
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    
    .welcome-subtitle {
      color: var(--secondary-color);
      font-size: 1.1rem;
      line-height: 1.5;
    }
    
    .features-list {
      text-align: left;
    }
    
    .feature-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 0;
      font-size: 1rem;
      color: var(--dark-color);
    }
    
    .btn-google {
      background: #4285f4;
      border: none;
      color: white;
      border-radius: var(--border-radius);
      padding: 1rem;
      font-size: 1.1rem;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
    }
    
    .btn-google:hover {
      background: #3367d6;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(66, 133, 244, 0.4);
      color: white;
    }
    
    .btn-google:active {
      transform: translateY(0);
    }
    
    .btn-google:disabled {
      opacity: 0.7;
      transform: none;
    }
    
    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .user-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 4px solid var(--primary-color);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .user-name {
      color: var(--dark-color);
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .user-email {
      color: var(--secondary-color);
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }
    
    .action-buttons .btn {
      border-radius: var(--border-radius);
      padding: 1rem;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    
    .btn-success {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      border: none;
      box-shadow: 0 4px 12px rgba(25, 135, 84, 0.3);
    }
    
    .btn-success:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(25, 135, 84, 0.4);
    }
    
    .btn-outline-success {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
    
    .btn-outline-success:hover {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }
    
    /* Animazioni */
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(25, 135, 84, 0); }
      100% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); }
    }
    
    .app-icon {
      animation: pulse 2s infinite;
    }
    
    /* Responsive */
    @media (max-width: 576px) {
      .login-card, .user-card {
        margin: 0.5rem;
        padding: 1.5rem;
      }
      
      .welcome-title {
        font-size: 1.75rem;
      }
      
      .app-icon {
        width: 70px;
        height: 70px;
      }
      
      .app-icon i {
        font-size: 2rem;
      }
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
