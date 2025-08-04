import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleSheetsModernService, Expense } from '../../services/google-sheets-modern.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-expense-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-4">
          <div class="row">
        <div class="col-md-8 mx-auto">
          <h2>Test Google Sheets Integration (Modern API)</h2>
          
          <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            Questo test usa le nuove Google Identity Services (GIS) per evitare errori di deprecazione.
          </div>          <div *ngIf="!(user$ | async)" class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            Devi essere loggato per usare questa funzione
          </div>

          <div *ngIf="user$ | async" class="card">
            <div class="card-body">
              <h5 class="card-title">Aggiungi Spesa di Test</h5>
              
              <form (ngSubmit)="addTestExpense()" #expenseForm="ngForm">
                <div class="mb-3">
                  <label for="amount" class="form-label">Importo (€)</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="amount" 
                    [(ngModel)]="testExpense.amount"
                    name="amount"
                    step="0.01"
                    required>
                </div>

                <div class="mb-3">
                  <label for="date" class="form-label">Data</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    id="date" 
                    [(ngModel)]="testExpense.date"
                    name="date"
                    required>
                </div>

                <div class="mb-3">
                  <label for="category" class="form-label">Categoria</label>
                  <select 
                    class="form-control" 
                    id="category" 
                    [(ngModel)]="testExpense.category"
                    name="category"
                    required>
                    <option value="">Seleziona categoria</option>
                    <option value="Alimentari">Alimentari</option>
                    <option value="Trasporti">Trasporti</option>
                    <option value="Intrattenimento">Intrattenimento</option>
                    <option value="Bollette">Bollette</option>
                    <option value="Altro">Altro</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label for="description" class="form-label">Descrizione (opzionale)</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="description" 
                    [(ngModel)]="testExpense.description"
                    name="description">
                </div>

                <button 
                  type="submit" 
                  class="btn btn-primary"
                  [disabled]="!expenseForm.form.valid || isLoading">
                  <span *ngIf="isLoading">
                    <i class="fas fa-spinner fa-spin"></i> Salvando...
                  </span>
                  <span *ngIf="!isLoading">
                    <i class="fas fa-plus"></i> Aggiungi Spesa
                  </span>
                </button>
              </form>

              <hr>

              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6>Spese Salvate</h6>
                <button 
                  class="btn btn-outline-secondary btn-sm"
                  (click)="loadExpenses()">
                  <i class="fas fa-sync"></i> Ricarica
                </button>
              </div>

              <div *ngIf="expenses.length === 0" class="text-muted">
                Nessuna spesa salvata ancora
              </div>

              <div *ngFor="let expense of expenses" class="card mb-2">
                <div class="card-body py-2">
                  <div class="row align-items-center">
                    <div class="col-2">
                      <small class="text-muted">{{ expense.date }}</small>
                    </div>
                    <div class="col-2">
                      <strong>€{{ expense.amount }}</strong>
                    </div>
                    <div class="col-3">
                      <span class="badge bg-secondary">{{ expense.category }}</span>
                    </div>
                    <div class="col-4">
                      <small>{{ expense.description }}</small>
                    </div>
                    <div class="col-1">
                      <button 
                        class="btn btn-outline-danger btn-sm"
                        (click)="deleteExpense(expense.id!)"
                        title="Elimina">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="message" class="alert" [ngClass]="messageType === 'error' ? 'alert-danger' : 'alert-success'" class="mt-3">
            {{ message }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .badge {
      font-size: 0.75rem;
    }
  `]
})
export class ExpenseTestComponent implements OnInit {
  user$: Observable<User | null>;
  expenses: Expense[] = [];
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  testExpense: Expense = {
    amount: 0,
    date: new Date().toISOString().split('T')[0], // Today's date
    category: '',
    description: ''
  };

  constructor(
    private googleSheetsService: GoogleSheetsModernService,
    private authService: AuthService
  ) {
    this.user$ = this.authService.user$;
  }

  ngOnInit() {
    // Load expenses when component initializes
    this.user$.subscribe(user => {
      if (user) {
        this.loadExpenses();
      }
    });
  }

  async addTestExpense() {
    this.isLoading = true;
    this.message = '';

    try {
      await this.googleSheetsService.addExpense(this.testExpense);
      this.message = 'Spesa aggiunta con successo!';
      this.messageType = 'success';
      
      // Reset form
      this.testExpense = {
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
}
