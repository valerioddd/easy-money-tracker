import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

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
export class GoogleSheetsRestService {
  private readonly SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive';
  private spreadsheetId: string | null = null;
  private isInitialized = false;

  constructor(private authService: AuthService) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      gapi.load('auth2', async () => {
        try {
          await gapi.auth2.init({
            client_id: '1008184469839-1gjdete3pthftru7611bgjqgdr9f36p9.apps.googleusercontent.com'
          });
          
          this.isInitialized = true;
          console.log('Google Auth initialized');
          resolve();
        } catch (error) {
          console.error('Error initializing Google Auth:', error);
          reject(error);
        }
      });
    });
  }

  async signInToGoogle(): Promise<string> {
    await this.initialize();
    
    const authInstance = gapi.auth2.getAuthInstance();
    
    if (!authInstance.isSignedIn.get()) {
      const user = await authInstance.signIn({
        scope: this.SCOPES
      });
      return user.getAuthResponse().access_token;
    }
    
    return authInstance.currentUser.get().getAuthResponse().access_token;
  }

  async addExpense(expense: Expense): Promise<void> {
    try {
      const accessToken = await this.signInToGoogle();
      
      let spreadsheetId = this.spreadsheetId;
      
      if (!spreadsheetId) {
        spreadsheetId = await this.createOrFindSpreadsheet(accessToken);
        this.spreadsheetId = spreadsheetId;
      }

      const expenseId = expense.id || Date.now().toString();
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Spese!A:E:append?valueInputOption=RAW`;
      
      const response = await fetch(appendUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [[
            expense.date,
            expense.amount,
            expense.category,
            expense.description || '',
            expenseId
          ]]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
      }

      console.log('Expense added successfully via REST API');
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  private async createOrFindSpreadsheet(accessToken: string): Promise<string> {
    // Cerca spreadsheet esistente
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='Easy Money Tracker' and mimeType='application/vnd.google-apps.spreadsheet'`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Crea nuovo spreadsheet
    const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: 'Easy Money Tracker'
        },
        sheets: [{
          properties: {
            title: 'Spese'
          }
        }]
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Create failed: ${createResponse.status}`);
    }

    const createData = await createResponse.json();
    const spreadsheetId = createData.spreadsheetId;

    // Aggiungi headers
    await this.addHeaders(spreadsheetId, accessToken);
    
    return spreadsheetId;
  }

  private async addHeaders(spreadsheetId: string, accessToken: string): Promise<void> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Spese!A1:E1?valueInputOption=RAW`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [['Data', 'Importo', 'Categoria', 'Descrizione', 'ID']]
      })
    });

    if (!response.ok) {
      throw new Error(`Add headers failed: ${response.status}`);
    }
  }

  async getExpenses(): Promise<Expense[]> {
    try {
      const accessToken = await this.signInToGoogle();
      
      if (!this.spreadsheetId) {
        this.spreadsheetId = await this.createOrFindSpreadsheet(accessToken);
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Spese!A2:E`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Get expenses failed: ${response.status}`);
      }

      const data = await response.json();
      const values = data.values || [];
      
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
      const accessToken = await this.signInToGoogle();
      
      if (!this.spreadsheetId) {
        this.spreadsheetId = await this.createOrFindSpreadsheet(accessToken);
      }

      // Prima trova la riga dell'expense
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Spese!A:E`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Get data failed: ${response.status}`);
      }

      const data = await response.json();
      const values = data.values || [];
      const rowIndex = values.findIndex((row: any[]) => row[4] === expenseId);

      if (rowIndex > 0) { // Skip header row
        // Elimina la riga usando batchUpdate
        const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`;
        const batchResponse = await fetch(batchUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
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
          })
        });

        if (!batchResponse.ok) {
          throw new Error(`Delete failed: ${batchResponse.status}`);
        }

        console.log('Expense deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
}
