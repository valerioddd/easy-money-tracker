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

  // Carica dinamicamente la Google Picker API
  private loadPickerApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any)["google"] && (window as any)["google"].picker) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        gapi.load('picker', { callback: resolve });
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  // Mostra il Google Picker per scegliere un file e uno sheet
  async showPicker(): Promise<{ fileId: string, sheetName: string }> {
    await this.getAccessToken();
    await this.loadPickerApi();

    return new Promise((resolve, reject) => {
      const view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false);

      const picker = new google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(this.accessToken)
        .setCallback((data: any) => {
          if (data.action === google.picker.Action.PICKED) {
            const fileId = data.docs[0].id;
            
            // Ottieni la lista dei sheet in modo più sicuro
            this.getSheetNamesForFile(fileId).then((sheets) => {
              let sheetName = sheets[0];
              if (sheets.length > 1) {
                sheetName = prompt('Seleziona il nome dello sheet:\n' + sheets.join('\n'), sheets[0]) || sheets[0];
              }
              
              // Salva in localStorage
              localStorage.setItem('emt_spreadsheetId', fileId);
              localStorage.setItem('emt_sheetName', sheetName);
              this.spreadsheetId = fileId;
              
              console.log('File e sheet selezionati:', { fileId, sheetName });
              resolve({ fileId, sheetName });
            }).catch((error) => {
              console.error('Errore nel recupero dei sheet:', error);
              // Fallback: chiedi all'utente di specificare il nome dello sheet
              const userSheetName = prompt('Inserisci il nome dello sheet da utilizzare:', 'Foglio1') || 'Foglio1';
              localStorage.setItem('emt_spreadsheetId', fileId);
              localStorage.setItem('emt_sheetName', userSheetName);
              this.spreadsheetId = fileId;
              console.log('Usando sheet specificato dall\'utente:', userSheetName);
              resolve({ fileId, sheetName: userSheetName });
            });
          } else if (data.action === google.picker.Action.CANCEL) {
            reject('Picker annullato');
          }
        })
        .setTitle('Scegli un file Google Sheets')
        .build();
      picker.setVisible(true);
    });
  }

  // Recupera fileId e sheetName selezionati
  getSelectedFileAndSheet(): { fileId: string | null, sheetName: string | null } {
    return {
      fileId: localStorage.getItem('emt_spreadsheetId'),
      sheetName: localStorage.getItem('emt_sheetName')
    };
  }

  // Metodo helper per ottenere i nomi dei sheet di un file
  private async getSheetNamesForFile(fileId: string): Promise<string[]> {
    try {
      console.log('Recupero sheet per il file:', fileId);
      const response = await gapi.client.sheets.spreadsheets.get({ 
        spreadsheetId: fileId 
      });
      
      console.log('Risposta completa:', response);
      console.log('Response result:', response.result);
      
      // Verifica che la risposta abbia la struttura corretta
      if (!response.result) {
        console.error('Response.result è undefined');
        return ['Foglio1']; // Fallback
      }
      
      if (!response.result.sheets) {
        console.error('Response.result.sheets è undefined');
        console.log('Struttura response.result:', Object.keys(response.result));
        return ['Foglio1']; // Fallback
      }
      
      const sheets = response.result.sheets.map((s: any) => s.properties.title);
      console.log('Sheet trovati:', sheets);
      return sheets.length > 0 ? sheets : ['Foglio1']; // Fallback più sicuro
    } catch (error) {
      console.error('Errore nel recupero dei sheet:', error);
      return ['Foglio1']; // Fallback di default
    }
  }

  async addExpense(expense: Expense): Promise<void> {
    try {
      await this.initialize();
      await this.getAccessToken();
      const { fileId, sheetName } = this.getSelectedFileAndSheet();
      if (!fileId || !sheetName) throw new Error('Nessun file/sheet selezionato');
      this.spreadsheetId = fileId;

      const expenseId = expense.id || Date.now().toString();
      const values = [[
        expense.date,
        expense.amount,
        expense.category,
        expense.description || '',
        expenseId
      ]];

      const response = await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: fileId,
        range: `${sheetName}!A:E`,
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
      
      // Aggiungi headers al primo sheet
      await this.addHeaders(spreadsheetId, 'Spese');
      
      console.log('Created new spreadsheet:', spreadsheetId);
      return spreadsheetId;
    } catch (error) {
      console.error('Error creating/finding spreadsheet:', error);
      throw error;
    }
  }

  private async addHeaders(spreadsheetId: string, sheetName: string = 'Sheet1'): Promise<void> {
    const headers = [['Data', 'Importo', 'Categoria', 'Descrizione', 'ID']];
    
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A1:E1`,
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
      const { fileId, sheetName } = this.getSelectedFileAndSheet();
      if (!fileId || !sheetName) throw new Error('Nessun file/sheet selezionato');
      this.spreadsheetId = fileId;

      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: fileId,
        range: `${sheetName}!A2:E` // Skip header row
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
      const { fileId, sheetName } = this.getSelectedFileAndSheet();
      if (!fileId || !sheetName) throw new Error('Nessun file/sheet selezionato');
      this.spreadsheetId = fileId;

      // Prima trova la riga dell'expense
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: fileId,
        range: `${sheetName}!A:E`
      });

      const values = response.result.values || [];
      const rowIndex = values.findIndex((row: any[]) => row[4] === expenseId);

      if (rowIndex > 0) { // Skip header row
        // Ottenere l'ID del sheet
        const sheetData = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: fileId });
        const sheet = sheetData.result.sheets.find((s: any) => s.properties.title === sheetName);
        const sheetId = sheet ? sheet.properties.sheetId : 0;

        await gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: fileId,
          resource: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: sheetId,
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
