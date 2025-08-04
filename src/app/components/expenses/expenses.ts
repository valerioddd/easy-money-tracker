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
          <div *ngIf="user$ | async" class="expenses-list mt-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="text-success fw-bold mb-0">
                <i class="fas fa-list me-2"></i>Spese Salvate
              </h5>
              <button 
                class="btn btn-outline-success btn-sm"
                (click)="loadExpenses()">
                <i class="fas fa-sync-alt me-1"></i> Ricarica
              </button>
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
                  <div class="expense-amount">
                    €{{ expense.amount | number:'1.2-2' }}
                  </div>
                  <div class="expense-description">
                    <span *ngIf="expense.description; else noDescription">{{ expense.description }}</span>
                    <ng-template #noDescription>
                      <span class="text-muted">Nessuna descrizione</span>
                    </ng-template>
                  </div>
                  <div class="expense-meta">
                    <div class="expense-category">
                      <span class="category-badge" [style.color]="getCategoryColor(expense.category)">
                        <i [class]="getCategoryIcon(expense.category)" class="me-1"></i>{{ expense.category }}
                      </span>
                    </div>
                    <div class="expense-date">
                      <i class="fas fa-calendar me-1"></i>{{ formatDate(expense.date) }}
                    </div>
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
      margin-bottom: 2rem;
    }
    
    .card-header {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      padding: 1.5rem;
      border: none;
    }
    
    .card-body {
      padding: 2rem;
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
      gap: 0.5rem;
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
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      gap: 1rem;
    }
    
    .expense-amount {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--primary-color);
      background: var(--light-green);
      padding: 0.25rem 0.75rem;
      border-radius: 8px;
      min-width: 80px;
      text-align: center;
      white-space: nowrap;
      flex-shrink: 0;
    }
    
    .expense-description {
      flex: 1;
      min-width: 0;
      color: var(--dark-color);
      font-weight: 500;
      font-size: 0.9rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .expense-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
      flex-shrink: 0;
    }
    
    .expense-category .category-badge {
      display: inline-block;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      color: white;
      padding: 0.1rem 0.5rem;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    
    .expense-date {
      color: var(--secondary-color);
      font-size: 0.7rem;
      white-space: nowrap;
    }
    
    .expense-actions {
      display: flex;
      gap: 0.25rem;
      flex-shrink: 0;
      margin-left: 0.5rem;
    }
    
    .btn-outline-danger {
      border-radius: 6px;
      transition: all 0.2s ease;
      padding: 0.375rem 0.5rem;
      font-size: 0.8rem;
    }
    
    .btn-outline-success {
      border-radius: 8px;
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
    
    .btn-outline-success:hover {
      background: var(--primary-color);
      border-color: var(--primary-color);
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
        padding: 1.5rem;
      }
      
      .expense-content {
        padding: 0.6rem 0.75rem;
        gap: 0.75rem;
      }
      
      .expense-amount {
        font-size: 1rem;
        min-width: 70px;
        padding: 0.2rem 0.5rem;
      }
      
      .expense-description {
        font-size: 0.85rem;
      }
      
      .expense-meta {
        gap: 0.2rem;
      }
      
      .expense-category .category-badge {
        font-size: 0.65rem;
        padding: 0.08rem 0.4rem;
      }
      
      .expense-date {
        font-size: 0.65rem;
      }
      
      .expense-actions {
        margin-left: 0.25rem;
      }
      
      .btn-outline-danger {
        padding: 0.25rem 0.4rem;
        font-size: 0.75rem;
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
