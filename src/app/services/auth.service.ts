import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, user, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null>;
  
  constructor(private auth: Auth) {
    this.user$ = user(this.auth);
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    // Aggiungi gli scope necessari per Google Sheets
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    provider.addScope('https://www.googleapis.com/auth/drive');
    
    try {
      const result = await signInWithPopup(this.auth, provider);
      console.log('Login successful:', result.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
}
