import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

declare const gapi: any;

export interface Expense {
  id?: string;
  amount: number;
  date: string;
  category: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetsService {
  private readonly SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive';
  
  private isGapiLoaded = false;
  private spreadsheetId: string | null = null;

  constructor(private authService: AuthService) {}

  async initializeGapi(): Promise<void> {
    if (this.isGapiLoaded) return;

    return new Promise((resolve, reject) => {
      gapi.load('client:auth2', async () => {
        try {
          console.log('Initializing GAPI with Client ID:', environment.google.clientId);
          
          // Inizializza GAPI SENZA discovery docs - le caricheremo separatamente
          await gapi.client.init({
            clientId: environment.google.clientId,
            scope: this.SCOPES
          });

          // Carica manualmente le API dopo l'inizializzazione
          await gapi.client.load('sheets', 'v4');
          await gapi.client.load('drive', 'v3');
          
          this.isGapiLoaded = true;
          console.log('GAPI initialized successfully');
          resolve();
        } catch (error) {
          console.error('Error initializing GAPI:', error);
          reject(error);
        }
      });
    });
  }

  async createOrFindSpreadsheet(): Promise<string> {
    if (this.spreadsheetId) return this.spreadsheetId;

    try {
      // Prima prova a cercare un foglio esistente chiamato "Easy Money Tracker"
      const searchResponse = await gapi.client.request({
        path: 'https://www.googleapis.com/drive/v3/files',
        params: {
          q: "name='Easy Money Tracker' and mimeType='application/vnd.google-apps.spreadsheet'"
        }
      });

      if (searchResponse.result.files && searchResponse.result.files.length > 0) {
        this.spreadsheetId = searchResponse.result.files[0].id;
        console.log('Found existing spreadsheet:', this.spreadsheetId);
        return this.spreadsheetId!;
      }

      // Se non esiste, crea un nuovo foglio
      const createResponse = await gapi.client.sheets.spreadsheets.create({
        properties: {
          title: 'Easy Money Tracker'
        },
        sheets: [{
          properties: {
            title: 'Spese',
            gridProperties: {
              rowCount: 1000,
              columnCount: 5
            }
          }
        }]
      });

      this.spreadsheetId = createResponse.result.spreadsheetId;
      
      // Aggiungi le intestazioni
      await this.setupHeaders();
      
      console.log('Created new spreadsheet:', this.spreadsheetId);
      return this.spreadsheetId!;
    } catch (error) {
      console.error('Error creating/finding spreadsheet:', error);
      throw error;
    }
  }

  private async setupHeaders(): Promise<void> {
    if (!this.spreadsheetId) return;

    const headers = [['Data', 'Importo', 'Categoria', 'Descrizione', 'ID']];
    
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: 'Spese!A1:E1',
      valueInputOption: 'RAW',
      values: headers
    });
  }

  async addExpense(expense: Expense): Promise<void> {
    try {
      await this.initializeGapi();
      
      // Assicurati che l'utente sia autenticato in Google API
      const authInstance = gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        console.log('User not signed in to Google API, signing in...');
        await authInstance.signIn();
      }
      
      const spreadsheetId = await this.createOrFindSpreadsheet();
      
      const expenseId = expense.id || Date.now().toString();
      const values = [[
        expense.date,
        expense.amount,
        expense.category,
        expense.description || '',
        expenseId
      ]];

      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: 'Spese!A:E',
        valueInputOption: 'RAW',
        values: values
      });

      console.log('Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  async getExpenses(): Promise<Expense[]> {
    try {
      await this.initializeGapi();
      const spreadsheetId = await this.createOrFindSpreadsheet();

      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: 'Spese!A2:E' // Skip header row
      });

      const values = response.result.values || [];
      
      return values.map((row: any[]) => ({
        date: row[0] || '',
        amount: parseFloat(row[1]) || 0,
        category: row[2] || '',
        description: row[3] || '',
        id: row[4] || ''
      }));
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw error;
    }
  }

  async deleteExpense(expenseId: string): Promise<void> {
    try {
      await this.initializeGapi();
      const spreadsheetId = await this.createOrFindSpreadsheet();

      // Prima trova la riga dell'expense
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: 'Spese!A:E'
      });

      const values = response.result.values || [];
      const rowIndex = values.findIndex((row: any[]) => row[4] === expenseId);

      if (rowIndex > 0) { // Skip header row
        await gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: spreadsheetId,
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0, // ID del primo sheet
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }]
        });
        console.log('Expense deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
}
