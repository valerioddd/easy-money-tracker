import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService, Category } from '../../services/categories.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          
          <!-- Header -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="d-flex align-items-center">
              <i class="fas fa-tags me-3 text-success" style="font-size: 1.5rem;"></i>
              <h2 class="mb-0 text-success">Gestione Categorie</h2>
            </div>
            <button 
              class="btn btn-outline-success btn-sm"
              (click)="showAddForm = !showAddForm">
              <i class="fas fa-plus me-1"></i>
              Aggiungi
            </button>
          </div>

          <!-- Form Aggiungi/Modifica Categoria -->
          <div *ngIf="showAddForm || editingCategory" class="expense-card mb-4">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-tag me-2"></i>
                {{ editingCategory ? 'Modifica Categoria' : 'Nuova Categoria' }}
              </h5>
            </div>
            <div class="card-body">
              <form (ngSubmit)="saveCategory()" #categoryForm="ngForm">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Nome</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      [(ngModel)]="currentCategory.name"
                      name="name"
                      required
                      placeholder="Es. Alimentari">
                  </div>
                  
                  <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Icona</label>
                    <select 
                      class="form-control" 
                      [(ngModel)]="currentCategory.icon"
                      name="icon"
                      required>
                      <option value="">Seleziona icona</option>
                      <option value="fas fa-shopping-cart">🛒 Carrello</option>
                      <option value="fas fa-car">🚗 Auto</option>
                      <option value="fas fa-home">🏠 Casa</option>
                      <option value="fas fa-heartbeat">❤️ Salute</option>
                      <option value="fas fa-gamepad">🎮 Svago</option>
                      <option value="fas fa-tshirt">👕 Abbigliamento</option>
                      <option value="fas fa-graduation-cap">🎓 Istruzione</option>
                      <option value="fas fa-utensils">🍽️ Ristorante</option>
                      <option value="fas fa-gas-pump">⛽ Carburante</option>
                      <option value="fas fa-wifi">📶 Internet</option>
                      <option value="fas fa-mobile-alt">📱 Telefono</option>
                      <option value="fas fa-plane">✈️ Viaggi</option>
                      <option value="fas fa-dumbbell">🏋️ Sport</option>
                      <option value="fas fa-paw">🐾 Animali</option>
                      <option value="fas fa-gift">🎁 Regali</option>
                      <option value="fas fa-tools">🔧 Riparazioni</option>
                      <option value="fas fa-coffee">☕ Caffè</option>
                      <option value="fas fa-film">🎬 Cinema</option>
                      <option value="fas fa-book">📚 Libri</option>
                      <option value="fas fa-ellipsis-h">➕ Altro</option>
                    </select>
                  </div>
                </div>
                
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Colore</label>
                    <div class="d-flex flex-wrap gap-2">
                      <div 
                        *ngFor="let color of availableColors" 
                        class="color-option"
                        [class.selected]="currentCategory.color === color"
                        [style.background-color]="color"
                        (click)="currentCategory.color = color">
                      </div>
                    </div>
                    <input 
                      type="color" 
                      class="form-control form-control-color mt-2" 
                      [(ngModel)]="currentCategory.color"
                      name="color"
                      title="Scegli colore personalizzato">
                  </div>
                  
                  <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Anteprima</label>
                    <div class="preview-category">
                      <i [class]="currentCategory.icon" [style.color]="currentCategory.color"></i>
                      <span>{{ currentCategory.name || 'Nome categoria' }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="d-flex gap-2">
                  <button 
                    type="submit" 
                    class="btn btn-success"
                    [disabled]="!categoryForm.valid">
                    <i class="fas fa-save me-1"></i>
                    {{ editingCategory ? 'Aggiorna' : 'Salva' }}
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-secondary"
                    (click)="cancelEdit()">
                    <i class="fas fa-times me-1"></i>
                    Annulla
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Lista Categorie -->
          <div class="expense-card">
            <div class="card-header">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                  <i class="fas fa-list me-2"></i>
                  Categorie ({{ categories.length }})
                </h5>
              </div>
            </div>
            <div class="card-body p-0">
              <div class="category-list">
                <div 
                  *ngFor="let category of categories" 
                  class="category-item"
                  [class.default-category]="category.isDefault">
                  
                  <div class="category-info">
                    <div class="category-icon" [style.color]="category.color">
                      <i [class]="category.icon"></i>
                    </div>
                    <div class="category-details">
                      <div class="category-name">{{ category.name }}</div>
                      <div class="category-meta">
                        <span class="badge" [style.background-color]="category.color + '20'" [style.color]="category.color">
                          {{ category.isDefault ? 'Predefinita' : 'Personalizzata' }}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="category-actions">
                    <button 
                      class="btn btn-sm btn-outline-primary"
                      (click)="editCategory(category)"
                      title="Modifica categoria">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button 
                      *ngIf="!category.isDefault"
                      class="btn btn-sm btn-outline-danger"
                      (click)="deleteCategory(category.id)"
                      title="Elimina categoria">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Messaggio -->
          <div *ngIf="message" 
               class="alert mt-3"
               [class.alert-success]="messageType === 'success'"
               [class.alert-danger]="messageType === 'error'">
            {{ message }}
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .color-option {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid transparent;
      transition: transform 0.2s;
    }
    
    .color-option:hover {
      transform: scale(1.1);
    }
    
    .color-option.selected {
      border-color: #000;
      transform: scale(1.2);
    }
    
    .preview-category {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background-color: var(--bs-light);
      border-radius: 8px;
      font-weight: 500;
    }
    
    .preview-category i {
      font-size: 1.2rem;
    }
    
    .category-list {
      max-height: 60vh;
      overflow-y: auto;
    }
    
    .category-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--bs-border-color);
      transition: background-color 0.2s;
    }
    
    .category-item:hover {
      background-color: var(--bs-light);
    }
    
    .category-item:last-child {
      border-bottom: none;
    }
    
    .category-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .category-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }
    
    .category-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .category-name {
      font-weight: 600;
      color: var(--bs-dark);
    }
    
    .category-meta .badge {
      font-size: 0.7rem;
      font-weight: 500;
    }
    
    .category-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    
    .category-actions .btn {
      padding: 4px 6px;
      font-size: 1rem;
      min-width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .default-category {
      background-color: rgba(40, 167, 69, 0.05);
    }
    
    .btn-outline-primary {
      border: none;
      background-color: rgba(13, 110, 253, 0.1);
      color: var(--bs-primary);
      padding: 4px 6px;
      font-size: 1rem;
      min-width: 28px;
      height: 28px;
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
    }
    
    .btn-outline-warning:hover,
    .btn-outline-warning:focus {
      background-color: rgba(255, 193, 7, 0.2);
      color: var(--bs-warning);
      border: none;
      box-shadow: 0 0 0 0.15rem rgba(255, 193, 7, 0.25);
    }
    
    .btn-outline-danger {
      border: none;
      background-color: rgba(220, 53, 69, 0.1);
      color: var(--bs-danger);
      padding: 4px 6px;
      font-size: 1rem;
      min-width: 28px;
      height: 28px;
    }
    
    .btn-outline-danger:hover,
    .btn-outline-danger:focus {
      background-color: rgba(220, 53, 69, 0.2);
      color: var(--bs-danger);
      border: none;
      box-shadow: 0 0 0 0.15rem rgba(220, 53, 69, 0.25);
    }
    
    @media (max-width: 768px) {
      .category-actions .btn {
        padding: 3px 5px;
        font-size: 0.9rem;
        min-width: 26px;
        height: 26px;
      }
      
      .category-icon {
        width: 35px;
        height: 35px;
        font-size: 1.1rem;
      }
    }
  `]
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  showAddForm = false;
  editingCategory: Category | null = null;
  message = '';
  messageType: 'success' | 'error' = 'success';
  
  currentCategory: Partial<Category> = {
    name: '',
    icon: '',
    color: '#28a745'
  };

  availableColors = [
    '#28a745', '#007bff', '#6f42c1', '#dc3545', '#fd7e14', 
    '#e83e8c', '#17a2b8', '#6c757d', '#ffc107', '#20c997'
  ];

  constructor(private categoriesService: CategoriesService) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoriesService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  saveCategory() {
    try {
      if (this.editingCategory) {
        this.categoriesService.updateCategory(this.editingCategory.id, this.currentCategory);
        this.showMessage('Categoria aggiornata con successo!', 'success');
      } else {
        this.categoriesService.addCategory(this.currentCategory as Omit<Category, 'id'>);
        this.showMessage('Categoria aggiunta con successo!', 'success');
      }
      this.cancelEdit();
    } catch (error) {
      this.showMessage('Errore nel salvare la categoria', 'error');
    }
  }

  editCategory(category: Category) {
    this.editingCategory = category;
    this.currentCategory = { ...category };
    this.showAddForm = true;
  }

  deleteCategory(id: string) {
    if (confirm('Sei sicuro di voler eliminare questa categoria?')) {
      try {
        this.categoriesService.deleteCategory(id);
        this.showMessage('Categoria eliminata con successo!', 'success');
      } catch (error) {
        this.showMessage('Errore: ' + (error as Error).message, 'error');
      }
    }
  }

  cancelEdit() {
    this.showAddForm = false;
    this.editingCategory = null;
    this.currentCategory = {
      name: '',
      icon: '',
      color: '#28a745'
    };
  }

  resetToDefaults() {
    if (confirm('Ripristinare tutte le categorie predefinite? Le categorie personalizzate saranno eliminate.')) {
      this.categoriesService.resetToDefaults();
      this.showMessage('Categorie ripristinate alle impostazioni predefinite', 'success');
    }
  }

  private showMessage(text: string, type: 'success' | 'error') {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }
}
