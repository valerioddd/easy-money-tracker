import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private readonly STORAGE_KEY = 'expense-categories';
  
  // Categorie predefinite
  private defaultCategories: Category[] = [
    { id: '1', name: 'Alimentari', icon: 'fas fa-shopping-cart', color: '#28a745', isDefault: true },
    { id: '2', name: 'Trasporti', icon: 'fas fa-car', color: '#007bff', isDefault: true },
    { id: '3', name: 'Casa', icon: 'fas fa-home', color: '#6f42c1', isDefault: true },
    { id: '4', name: 'Salute', icon: 'fas fa-heartbeat', color: '#dc3545', isDefault: true },
    { id: '5', name: 'Svago', icon: 'fas fa-gamepad', color: '#fd7e14', isDefault: true },
    { id: '6', name: 'Abbigliamento', icon: 'fas fa-tshirt', color: '#e83e8c', isDefault: true },
    { id: '7', name: 'Istruzione', icon: 'fas fa-graduation-cap', color: '#17a2b8', isDefault: true },
    { id: '8', name: 'Altro', icon: 'fas fa-ellipsis-h', color: '#6c757d', isDefault: true }
  ];

  private categoriesSubject = new BehaviorSubject<Category[]>(this.loadCategories());
  public categories$ = this.categoriesSubject.asObservable();

  constructor() {}

  private loadCategories(): Category[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const categories = JSON.parse(stored);
        return categories.length > 0 ? categories : this.defaultCategories;
      } catch {
        return this.defaultCategories;
      }
    }
    return this.defaultCategories;
  }

  private saveCategories(categories: Category[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(categories));
    this.categoriesSubject.next(categories);
  }

  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  getCategoriesSync(): Category[] {
    return this.categoriesSubject.value;
  }

  addCategory(category: Omit<Category, 'id'>): void {
    const categories = this.getCategoriesSync();
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
      isDefault: false
    };
    categories.push(newCategory);
    this.saveCategories(categories);
  }

  updateCategory(id: string, updates: Partial<Category>): void {
    const categories = this.getCategoriesSync();
    const index = categories.findIndex(cat => cat.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updates };
      this.saveCategories(categories);
    }
  }

  deleteCategory(id: string): void {
    const categories = this.getCategoriesSync();
    const category = categories.find(cat => cat.id === id);
    
    // Non permettere la cancellazione delle categorie predefinite
    if (category?.isDefault) {
      throw new Error('Non è possibile eliminare le categorie predefinite');
    }
    
    const filtered = categories.filter(cat => cat.id !== id);
    this.saveCategories(filtered);
  }

  getCategoryById(id: string): Category | undefined {
    return this.getCategoriesSync().find(cat => cat.id === id);
  }

  resetToDefaults(): void {
    this.saveCategories([...this.defaultCategories]);
  }
}
