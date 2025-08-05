import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';
import { GoogleSheetsModernService } from '../../services/google-sheets-modern.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          
          <!-- User Info Card -->
          <div *ngIf="user$ | async as user" class="expense-card mb-4">
            <div class="card-header">
              <div class="d-flex align-items-center">
                <i class="fas fa-user-circle me-3 text-success" style="font-size: 1.5rem;"></i>
                <h4 class="mb-0">Il Mio Profilo</h4>
              </div>
            </div>
            
            <div class="card-body text-center">
              <div class="user-profile-section">
                <img [src]="user.photoURL" 
                     [alt]="user.displayName" 
                     class="profile-avatar mb-3">
                <h5 class="text-dark">{{ user.displayName }}</h5>
                <p class="text-muted mb-3">{{ user.email }}</p>
                
                <div class="profile-stats row text-center mb-4">
                  <div class="col-4">
                    <div class="stat-card">
                      <div class="stat-number">{{ totalExpenses }}</div>
                      <div class="stat-label">Spese</div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="stat-card">
                      <div class="stat-number">{{ totalCategories }}</div>
                      <div class="stat-label">Categorie</div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="stat-card">
                      <div class="stat-number">{{ daysSinceFirstExpense }}</div>
                      <div class="stat-label">Giorni</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- App Settings -->
          <div class="expense-card mb-4">
            <div class="card-header">
              <div class="d-flex align-items-center">
                <i class="fas fa-cog me-3 text-success" style="font-size: 1.5rem;"></i>
                <h5 class="mb-0">Impostazioni</h5>
              </div>
            </div>
            
            <div class="card-body p-0">
              <div class="settings-list">
                <div class="setting-item">
                  <div class="setting-info">
                    <i class="fas fa-download text-primary"></i>
                    <div class="setting-details">
                      <div class="setting-title">Esporta Dati</div>
                      <div class="setting-description">Scarica tutte le tue spese in CSV</div>
                    </div>
                  </div>
                  <button class="btn btn-sm btn-outline-primary" (click)="exportData()">
                    <i class="fas fa-download"></i>
                  </button>
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <i class="fas fa-trash text-warning"></i>
                    <div class="setting-details">
                      <div class="setting-title">Cancella Tutto</div>
                      <div class="setting-description">Rimuovi tutte le spese salvate</div>
                    </div>
                  </div>
                  <button class="btn btn-sm btn-outline-warning" (click)="clearAllData()">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <i class="fas fa-info-circle text-info"></i>
                    <div class="setting-details">
                      <div class="setting-title">Informazioni App</div>
                      <div class="setting-description">Versione e crediti</div>
                    </div>
                  </div>
                  <button class="btn btn-sm btn-outline-info" (click)="showAppInfo()">
                    <i class="fas fa-info"></i>
                  </button>
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <i class="fas fa-table text-success"></i>
                    <div class="setting-details">
                      <div class="setting-title">File Google Sheets</div>
                      <div class="setting-description">
                        <span *ngIf="selectedFileId && selectedSheetName">
                          File selezionato: <span class="fw-bold">{{ selectedFileId | slice:0:8 }}...</span><br>
                          Sheet: <span class="fw-bold">{{ selectedSheetName }}</span>
                        </span>
                        <span *ngIf="!selectedFileId">Nessun file selezionato</span>
                      </div>
                    </div>
                  </div>
                  <button class="btn btn-sm btn-outline-success" (click)="changeFileAndSheet()">
                    <i class="fas fa-exchange-alt"></i> Cambia
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Logout Section -->
          <div class="expense-card">
            <div class="card-body text-center">
              <button 
                class="btn btn-outline-danger w-100"
                (click)="signOut()">
                <i class="fas fa-sign-out-alt me-2"></i>
                Logout
              </button>
              <p class="text-muted mt-2 mb-0 small">
                I tuoi dati sono salvati su Google Sheets e saranno disponibili al prossimo accesso
              </p>
            </div>
          </div>

          <!-- Message -->
          <div *ngIf="message" 
               class="alert mt-3"
               [class.alert-success]="messageType === 'success'"
               [class.alert-danger]="messageType === 'error'"
               [class.alert-info]="messageType === 'info'">
            {{ message }}
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid var(--primary-color);
      object-fit: cover;
    }
    
    .user-profile-section {
      padding: 1rem 0;
    }
    
    .profile-stats {
      margin: 1.5rem 0;
    }
    
    .stat-card {
      padding: 1rem 0.5rem;
    }
    
    .stat-number {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary-color);
      line-height: 1;
    }
    
    .stat-label {
      font-size: 0.8rem;
      color: var(--bs-secondary);
      margin-top: 0.25rem;
    }
    
    .settings-list {
      overflow: hidden;
    }
    
    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--bs-border-color);
      transition: background-color 0.2s;
    }
    
    .setting-item:hover {
      background-color: var(--bs-light);
    }
    
    .setting-item:last-child {
      border-bottom: none;
    }
    
    .setting-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }
    
    .setting-info i {
      width: 20px;
      text-align: center;
      font-size: 1.1rem;
    }
    
    .setting-details {
      flex: 1;
    }
    
    .setting-title {
      font-weight: 600;
      color: var(--bs-dark);
      margin-bottom: 0.2rem;
    }
    
    .setting-description {
      font-size: 0.85rem;
      color: var(--bs-secondary);
      line-height: 1.3;
    }
    
    .btn-outline-primary {
      border: none;
      background-color: rgba(13, 110, 253, 0.1);
      color: var(--bs-primary);
      padding: 4px 6px;
      font-size: 1rem;
      min-width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .btn-outline-primary:hover,
    .btn-outline-primary:focus {
      background-color: rgba(13, 110, 253, 0.2);
      color: var(--bs-primary);
      border: none;
      box-shadow: 0 0 0 0.15rem rgba(13, 110, 253, 0.25);
    }
    
    .btn-outline-warning {
      border: none;
      background-color: rgba(255, 193, 7, 0.1);
      color: var(--bs-warning);
      padding: 4px 6px;
      font-size: 1rem;
      min-width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .btn-outline-warning:hover,
    .btn-outline-warning:focus {
      background-color: rgba(255, 193, 7, 0.2);
      color: var(--bs-warning);
      border: none;
      box-shadow: 0 0 0 0.15rem rgba(255, 193, 7, 0.25);
    }
    
    .btn-outline-info {
      border: none;
      background-color: rgba(23, 162, 184, 0.1);
      color: var(--bs-info);
      padding: 4px 6px;
      font-size: 1rem;
      min-width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .btn-outline-info:hover,
    .btn-outline-info:focus {
      background-color: rgba(23, 162, 184, 0.2);
      color: var(--bs-info);
      border: none;
      box-shadow: 0 0 0 0.15rem rgba(23, 162, 184, 0.25);
    }
    
    .btn-outline-danger {
      border: none;
      background-color: rgba(220, 53, 69, 0.1);
      color: var(--bs-danger);
    }
    
    .btn-outline-danger:hover,
    .btn-outline-danger:focus {
      background-color: rgba(220, 53, 69, 0.2);
      color: var(--bs-danger);
      border: none;
      box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
    }
    
    @media (max-width: 576px) {
      .profile-avatar {
        width: 60px;
        height: 60px;
      }
      
      .stat-number {
        font-size: 1.2rem;
      }
      
      .setting-info {
        gap: 0.75rem;
      }
      
      .setting-item {
        padding: 0.75rem;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  user$: Observable<User | null>;
  totalExpenses = 0;
  totalCategories = 0;
  daysSinceFirstExpense = 0;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'success';
  selectedFileId: string | null = null;
  selectedSheetName: string | null = null;

  constructor(private authService: AuthService, private sheetsService: GoogleSheetsModernService) {
    this.user$ = this.authService.user$;
  }

  ngOnInit() {
    this.loadStats();
    this.loadSelectedFileAndSheet();
  }

  loadStats() {
    // Qui caricheremo le statistiche dai dati salvati
    // Per ora mettiamo dei valori di esempio
    this.totalExpenses = parseInt(localStorage.getItem('total-expenses') || '0');
    this.totalCategories = JSON.parse(localStorage.getItem('expense-categories') || '[]').length || 8;
    
    const firstExpenseDate = localStorage.getItem('first-expense-date');
    if (firstExpenseDate) {
      const daysDiff = Math.floor((Date.now() - new Date(firstExpenseDate).getTime()) / (1000 * 60 * 60 * 24));
      this.daysSinceFirstExpense = daysDiff;
    }
  }

  loadSelectedFileAndSheet() {
    const { fileId, sheetName } = this.sheetsService.getSelectedFileAndSheet();
    this.selectedFileId = fileId;
    this.selectedSheetName = sheetName;
  }

  async changeFileAndSheet() {
    try {
      await this.sheetsService.showPicker();
      this.loadSelectedFileAndSheet();
      this.showMessage('File e sheet selezionati!', 'success');
    } catch (err) {
      this.showMessage('Selezione annullata', 'info');
    }
  }

  exportData() {
    try {
      // Esporta i dati delle categorie e altre impostazioni
      const categories = localStorage.getItem('expense-categories') || '[]';
      const settings = {
        categories: JSON.parse(categories),
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0'
      };
      
      const dataStr = JSON.stringify(settings, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `trackmymoney-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      this.showMessage('Dati esportati con successo!', 'success');
    } catch (error) {
      this.showMessage('Errore durante l\'esportazione', 'error');
    }
  }

  clearAllData() {
    if (confirm('Sei sicuro di voler cancellare TUTTI i dati? Questa azione non può essere annullata.')) {
      if (confirm('ATTENZIONE: Verranno cancellate tutte le spese e le categorie personalizzate. Continuare?')) {
        try {
          // Manteniamo solo le categorie predefinite
          localStorage.removeItem('expense-categories');
          localStorage.removeItem('total-expenses');
          localStorage.removeItem('first-expense-date');
          
          this.loadStats();
          this.showMessage('Tutti i dati sono stati cancellati', 'info');
        } catch (error) {
          this.showMessage('Errore durante la cancellazione', 'error');
        }
      }
    }
  }

  showAppInfo() {
    this.showMessage('TrackMyMoney v1.0.0 - Creato con Angular e Google Sheets API', 'info');
  }

  signOut() {
    this.authService.signOut();
  }

  private showMessage(text: string, type: 'success' | 'error' | 'info') {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 4000);
  }
}
