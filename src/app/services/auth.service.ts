
import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signOut, user, User, setPersistence, browserLocalPersistence, signInWithRedirect, getRedirectResult } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null>;
  

  constructor(private auth: Auth, private router: Router) {
    this.user$ = user(this.auth);
    // Imposta la persistenza locale per mantenere la sessione anche dopo refresh/riavvio
    setPersistence(this.auth, browserLocalPersistence);
    // Gestione automatica del redirect dopo login
    this.handleRedirectResult();
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    provider.addScope('https://www.googleapis.com/auth/drive');
    try {
      // Login in-page, senza popup, compatibile PWA
      await signInWithRedirect(this.auth, provider);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Gestisce il risultato del login dopo il redirect
  async handleRedirectResult(): Promise<void> {
    try {
      const result = await getRedirectResult(this.auth);
      if (result && result.user) {
        console.log('Login redirect successful:', result.user);
        // Reindirizza alla pagina delle spese dopo il login
        this.router.navigate(['/expenses']);
      }
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'auth/no-auth-event') {
        console.error('Redirect login error:', error);
      }
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('Logout successful');
      // Reindirizza al login dopo il logout
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
}
