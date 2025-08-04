import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

// Dichiara i tipi per Google Identity Services
declare const google: any;
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
export class GoogleSheetsModernService {
  private readonly SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive';
  private spreadsheetId: string | null = null;
  private isInitialized = false;
  private accessToken: string | null = null;

  constructor(private authService: AuthService) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({});
          
          // Carica le API necessarie
          await gapi.client.load('sheets', 'v4');
          await gapi.client.load('drive', 'v3');
          
          this.isInitialized = true;
          console.log('GAPI client initialized successfully');
          resolve();
        } catch (error) {
          console.error('Error initializing GAPI client:', error);
          reject(error);
        }
      });
    });
  }

  async getAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.accessToken) {
        resolve(this.accessToken);
        return;
      }

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: environment.google.clientId,
        scope: this.SCOPES,
        callback: (response: any) => {
          if (response.error) {
            reject(response);
            return;
          }
          
          this.accessToken = response.access_token;
          gapi.client.setToken({ access_token: response.access_token });
          console.log('Access token obtained successfully');
          resolve(response.access_token);
        },
      });

      tokenClient.requestAccessToken();
    });
  }

  async addExpense(expense: Expense): Promise<void> {
    try {
      await this.initialize();
      await this.getAccessToken();
      
      let spreadsheetId = this.spreadsheetId;
      
      if (!spreadsheetId) {
        spreadsheetId = await this.createOrFindSpreadsheet();
        this.spreadsheetId = spreadsheetId;
      }

      const expenseId = expense.id || Date.now().toString();
      const values = [[
        expense.date,
        expense.amount,
        expense.category,
        expense.description || '',
        expenseId
      ]];

      const response = await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: 'Spese!A:E',
        valueInputOption: 'RAW',
        resource: {
          values: values
        }
      });

      console.log('Expense added successfully:', response);
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  private async createOrFindSpreadsheet(): Promise<string> {
    try {
      // Cerca spreadsheet esistente
      const searchResponse = await gapi.client.drive.files.list({
        q: "name='Easy Money Tracker' and mimeType='application/vnd.google-apps.spreadsheet'"
      });

      if (searchResponse.result.files && searchResponse.result.files.length > 0) {
        console.log('Found existing spreadsheet:', searchResponse.result.files[0].id);
        return searchResponse.result.files[0].id;
      }

      // Crea nuovo spreadsheet
      const createResponse = await gapi.client.sheets.spreadsheets.create({
        resource: {
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
        }
      });

      const spreadsheetId = createResponse.result.spreadsheetId;
      
      // Aggiungi headers
      await this.addHeaders(spreadsheetId);
      
      console.log('Created new spreadsheet:', spreadsheetId);
      return spreadsheetId;
    } catch (error) {
      console.error('Error creating/finding spreadsheet:', error);
      throw error;
    }
  }

  private async addHeaders(spreadsheetId: string): Promise<void> {
    const headers = [['Data', 'Importo', 'Categoria', 'Descrizione', 'ID']];
    
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'Spese!A1:E1',
      valueInputOption: 'RAW',
      resource: {
        values: headers
      }
    });
  }

  async getExpenses(): Promise<Expense[]> {
    try {
      await this.initialize();
      await this.getAccessToken();
      
      if (!this.spreadsheetId) {
        this.spreadsheetId = await this.createOrFindSpreadsheet();
      }

      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
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
      await this.initialize();
      await this.getAccessToken();
      
      if (!this.spreadsheetId) {
        this.spreadsheetId = await this.createOrFindSpreadsheet();
      }

      // Prima trova la riga dell'expense
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Spese!A:E'
      });

      const values = response.result.values || [];
      const rowIndex = values.findIndex((row: any[]) => row[4] === expenseId);

      if (rowIndex > 0) { // Skip header row
        await gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
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
          }
        });
        console.log('Expense deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
}
