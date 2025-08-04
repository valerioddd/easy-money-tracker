import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleSheetsModernService, Expense } from '../../services/google-sheets-modern.service';
import { CategoriesService, Category } from '../../services/categories.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          
          <!-- Content only shows when user is logged in -->
          <div *ngIf="user$ | async" class="expense-card">
            <div class="card-header">
              <div class="d-flex align-items-center">
                <i class="fas fa-plus-circle me-3" style="font-size: 1.5rem;"></i>
                <h4 class="mb-0">Aggiungi Spesa</h4>
              </div>
            </div>
            
            <div class="card-body">
              <form (ngSubmit)="addExpense()" #expenseForm="ngForm">
                <div class="row">
                  <div class="col-6">
                    <div class="form-floating mb-3">
                      <input 
                        type="number" 
                        class="form-control" 
                        id="amount" 
                        [(ngModel)]="newExpense.amount"
                        name="amount"
                        step="0.01"
                        placeholder="0.00"
                        required>
                      <label for="amount">
                        <i class="fas fa-euro-sign me-2"></i>Importo (€)
                      </label>
                    </div>
                  </div>
                  
                  <div class="col-6">
                    <div class="form-floating mb-3">
                      <input 
                        type="date" 
                        class="form-control" 
                        id="date" 
                        [(ngModel)]="newExpense.date"
                        name="date"
                        required>
                      <label for="date">
                        <i class="fas fa-calendar me-2"></i>Data
                      </label>
                    </div>
                  </div>
                </div>

                <div class="form-floating mb-3">
                  <select 
                    class="form-select" 
                    id="category" 
                    [(ngModel)]="newExpense.category"
                    name="category"
                    required>
                    <option value="">Seleziona categoria</option>
                    <option 
                      *ngFor="let category of categories" 
                      [value]="category.name">
                      <i [class]="category.icon"></i> {{ category.name }}
                    </option>
                  </select>
                  <label for="category">
                    <i class="fas fa-tags me-2"></i>Categoria
                  </label>
                </div>

                <div class="form-floating mb-4">
                  <input 
                    type="text" 
                    class="form-control" 
                    id="description" 
                    [(ngModel)]="newExpense.description"
                    name="description"
                    placeholder="Descrizione opzionale">
                  <label for="description">
                    <i class="fas fa-comment me-2"></i>Descrizione (opzionale)
                  </label>
                </div>

                <button 
                  type="submit" 
                  class="btn btn-success btn-lg w-100"
                  [disabled]="!expenseForm.form.valid || isLoading">
                  <span *ngIf="isLoading">
                    <i class="fas fa-spinner fa-spin me-2"></i> Salvando...
                  </span>
                  <span *ngIf="!isLoading">
                    <i class="fas fa-plus me-2"></i> Aggiungi Spesa
                  </span>
                </button>
              </form>
            </div>
          </div>

          <!-- Lista Spese -->
          <div *ngIf="user$ | async" class="expenses-list mt-3">
            <div class="expenses-header mb-2">
              <h5 class="text-success fw-bold mb-0 d-flex align-items-center">
                <i class="fas fa-list me-2"></i>Spese
              </h5>
            </div>

            <div *ngIf="expenses.length === 0" class="empty-state">
              <div class="text-center py-5">
                <i class="fas fa-receipt text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-3">Nessuna spesa salvata ancora</p>
                <p class="small text-muted">Aggiungi la tua prima spesa usando il form sopra!</p>
              </div>
            </div>

            <div class="expenses-grid">
              <div *ngFor="let expense of expenses; trackBy: trackByExpenseId" class="expense-item">
                <div class="expense-content">
                  <!-- Mobile: Amount and Delete button on top row -->
                  <div class="expense-header">
                    <div class="expense-amount">
                      €{{ expense.amount | number:'1.2-2' }}
                    </div>
                    <div class="expense-actions">
                      <button 
                        class="btn btn-outline-danger btn-sm"
                        (click)="deleteExpense(expense.id!)"
                        title="Elimina spesa">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  
                  <!-- Description always visible -->
                  <div class="expense-description">
                    <span *ngIf="expense.description && expense.description.trim(); else noDescription">
                      {{ expense.description }}
                    </span>
                    <ng-template #noDescription>
                      <span class="text-muted fst-italic">Nessuna descrizione</span>
                    </ng-template>
                  </div>
                  
                  <!-- Bottom row: Date and Category -->
                  <div class="expense-footer">
                    <div class="expense-date">
                      <i class="fas fa-calendar me-1"></i>{{ formatDate(expense.date) }}
                    </div>
                    <div class="expense-category">
                      <span class="category-badge" 
                            [style.color]="getCategoryColor(expense.category)"
                            [style.background-color]="getCategoryBackgroundColor(expense.category)">
                        <i [class]="getCategoryIcon(expense.category)" class="me-1"></i>{{ expense.category }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Reload button at bottom right -->
            <div *ngIf="expenses.length > 0" class="expenses-footer mt-2">
              <div class="d-flex justify-content-end">
                <button 
                  class="btn btn-outline-success btn-sm"
                  (click)="loadExpenses()">
                  <i class="fas fa-sync-alt me-1"></i> Ricarica
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="message" class="alert rounded-4 mt-3" [ngClass]="messageType === 'error' ? 'alert-danger' : 'alert-success'">
            <i class="fas" [ngClass]="messageType === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'" class="me-2"></i>
            {{ message }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .expense-card {
      background: white;
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      overflow: hidden;
      margin-bottom: 1.5rem;
    }
    
    .card-header {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      padding: 1rem;
      border: none;
    }
    
    .card-body {
      padding: 1.5rem;
    }
    
    .form-floating > .form-control,
    .form-floating > .form-select {
      border: 2px solid #e8f5e8;
      border-radius: var(--border-radius);
      transition: all 0.3s ease;
    }
    
    .form-floating > .form-control:focus,
    .form-floating > .form-select:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
    }
    
    .form-floating > label {
      color: var(--secondary-color);
      font-weight: 500;
    }
    
    .btn-success {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      border: none;
      border-radius: var(--border-radius);
      box-shadow: 0 4px 12px rgba(25, 135, 84, 0.3);
      transition: all 0.3s ease;
    }
    
    .btn-success:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(25, 135, 84, 0.4);
    }
    
    .btn-success:active {
      transform: translateY(0);
    }
    
    .expenses-grid {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .expenses-header h5 {
      font-size: 1.1rem;
    }
    
    .expenses-header h5 i {
      font-size: 1rem;
      vertical-align: middle;
    }
    
    .expenses-footer {
      padding-top: 0.5rem;
    }
    
    .expense-item {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(25, 135, 84, 0.08);
      transition: all 0.2s ease;
      border: 1px solid var(--light-green);
      border-left: 4px solid var(--primary-color);
    }
    
    .expense-item:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(25, 135, 84, 0.12);
    }
    
    .expense-content {
      padding: 0.75rem;
    }
    
    .expense-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .expense-amount {
      font-size: 1rem;
      font-weight: 700;
      color: var(--primary-color);
      background: var(--light-green);
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      min-width: 70px;
      text-align: center;
      white-space: nowrap;
      flex-shrink: 0;
    }
    
    .expense-description {
      color: var(--dark-color);
      font-weight: 500;
      font-size: 0.9rem;
      line-height: 1.3;
      margin-bottom: 0.5rem;
      min-height: 1.2rem; /* Ensures space even when empty */
      padding: 0.15rem 0;
      border-left: 3px solid transparent;
    }
    
    .expense-description span:not(.text-muted) {
      font-weight: 600;
      color: var(--bs-dark);
    }
    
    .expense-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .expense-date {
      color: var(--secondary-color);
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }
    
    .expense-category .category-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      border: 1px solid currentColor;
      transition: all 0.2s ease;
      text-align: center;
      white-space: nowrap;
    }
    
    .expense-actions {
      display: flex;
      gap: 0.1rem;
      flex-shrink: 0;
    }
    
    .btn-outline-danger {
      border: none;
      background: rgba(220, 53, 69, 0.1);
      color: #dc3545;
      border-radius: 4px;
      transition: all 0.2s ease;
      padding: 0.25rem 0.4rem;
      font-size: 0.75rem;
    }
    
    .btn-outline-danger:hover {
      background: rgba(220, 53, 69, 0.2);
      color: #dc3545;
      transform: scale(1.05);
    }
    
    .btn-outline-danger:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
    }
    
    .btn-outline-success {
      border: none;
      background: rgba(25, 135, 84, 0.1);
      color: var(--primary-color);
      border-radius: 8px;
      transition: all 0.2s ease;
    }
    
    .btn-outline-success:hover {
      background: rgba(25, 135, 84, 0.2);
      color: var(--primary-color);
      transform: translateY(-1px);
    }
    
    .btn-outline-success:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(25, 135, 84, 0.25);
    }
    
    .empty-state {
      background: white;
      border-radius: var(--border-radius);
      border: 2px dashed var(--medium-green);
    }
    
    .alert {
      border: none;
      border-radius: var(--border-radius);
    }
    
    .alert-success {
      background: var(--light-green);
      color: var(--primary-dark);
      border-left: 4px solid var(--primary-color);
    }
    
    .alert-danger {
      background: #f8d7da;
      color: #721c24;
      border-left: 4px solid var(--danger-color);
    }
    
    /* Responsive */
    @media (max-width: 576px) {
      .card-body {
        padding: 1rem;
      }
      
      .expense-content {
        padding: 0.6rem;
      }
      
      .expense-header {
        margin-bottom: 0.4rem;
      }
      
      .expense-amount {
        font-size: 1rem;
        background: none;
        padding: 0;
        color: var(--primary-color);
        text-align: left;
        min-width: auto;
      }
      
      .expense-description {
        font-size: 0.9rem;
        margin-bottom: 0.4rem;
        min-height: 1.1rem;
        padding: 0.2rem 0;
        font-weight: 500;
      }
      
      .expense-description span:not(.text-muted) {
        font-weight: 600;
        color: var(--bs-dark);
      }
      
      .expense-date {
        font-size: 0.7rem;
      }
      
      .expense-category .category-badge {
        font-size: 0.65rem;
        padding: 0.15rem 0.5rem;
      }
      
      .btn-outline-danger {
        border: none;
        background: rgba(220, 53, 69, 0.1);
        color: #dc3545;
        padding: 0.2rem 0.35rem;
        font-size: 0.7rem;
      }
      
      .btn-outline-danger:hover {
        background: rgba(220, 53, 69, 0.2);
        transform: scale(1.05);
      }
    }
  `]
})
export class ExpensesComponent implements OnInit {
  user$: Observable<User | null>;
  expenses: Expense[] = [];
  categories: Category[] = [];
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  newExpense: Expense = {
    amount: 0,
    date: new Date().toISOString().split('T')[0], // Today's date
    category: '',
    description: ''
  };

  constructor(
    private googleSheetsService: GoogleSheetsModernService,
    private categoriesService: CategoriesService,
    private authService: AuthService
  ) {
    this.user$ = this.authService.user$;
  }

  ngOnInit() {
    // Load expenses when component initializes
    this.loadExpenses();
    this.loadCategories();
  }

  loadCategories() {
    this.categoriesService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  async addExpense() {
    this.isLoading = true;
    this.message = '';

    try {
      await this.googleSheetsService.addExpense(this.newExpense);
      this.message = 'Spesa aggiunta con successo!';
      this.messageType = 'success';
      
      // Update statistics
      this.updateStats();
      
      // Reset form
      this.newExpense = {
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: ''
      };

      // Reload expenses
      await this.loadExpenses();
    } catch (error) {
      this.message = 'Errore durante il salvataggio: ' + error;
      this.messageType = 'error';
      console.error('Error adding expense:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadExpenses() {
    try {
      this.expenses = await this.googleSheetsService.getExpenses();
      
      // Debug: verifica se le descrizioni sono presenti
      console.log('Loaded expenses:', this.expenses);
      this.expenses.forEach((expense, index) => {
        console.log(`Expense ${index}: description = "${expense.description}"`);
      });
      
    } catch (error) {
      this.message = 'Errore durante il caricamento delle spese: ' + error;
      this.messageType = 'error';
      console.error('Error loading expenses:', error);
    }
  }

  async deleteExpense(expenseId: string) {
    if (!confirm('Sei sicuro di voler eliminare questa spesa?')) {
      return;
    }

    try {
      await this.googleSheetsService.deleteExpense(expenseId);
      this.message = 'Spesa eliminata con successo!';
      this.messageType = 'success';
      await this.loadExpenses();
    } catch (error) {
      this.message = 'Errore durante l\'eliminazione: ' + error;
      this.messageType = 'error';
      console.error('Error deleting expense:', error);
    }
  }

  trackByExpenseId(index: number, expense: Expense): string {
    return expense.id || index.toString();
  }

  getCategoryIcon(category: string): string {
    const categoryObj = this.categories.find(cat => cat.name === category);
    return categoryObj?.icon || 'fas fa-question';
  }

  getCategoryColor(category: string): string {
    const categoryObj = this.categories.find(cat => cat.name === category);
    return categoryObj?.color || '#6c757d';
  }

  getCategoryBackgroundColor(category: string): string {
    const categoryObj = this.categories.find(cat => cat.name === category);
    const color = categoryObj?.color || '#6c757d';
    
    // Converto il colore hex in RGB e aggiungo opacità
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    const rgb = hexToRgb(color);
    return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : 'rgba(108, 117, 125, 0.15)';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  updateStats() {
    const stats = JSON.parse(localStorage.getItem('expenseStats') || '{"totalExpenses": 0, "totalAmount": 0, "lastExpense": null}');
    stats.totalExpenses += 1;
    stats.totalAmount += Number(this.newExpense.amount);
    stats.lastExpense = new Date().toISOString().split('T')[0];
    localStorage.setItem('expenseStats', JSON.stringify(stats));
  }
}
