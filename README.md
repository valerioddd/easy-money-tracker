# Easy Money Tracker 💰

PWA per tracciare le spese quotidiane con integrazione Google Sheets.

## 🎯 Caratteristiche

- ✅ **Login Google** - Autenticazione sicura con Firebase
- ✅ **Google Sheets Integration** - Salvataggio automatico delle spese su Google Drive
- ✅ **PWA** - Installabile su smartphone come app nativa
- ✅ **Bootstrap UI** - Interfaccia responsive e mobile-first
- ✅ **Angular + NgRx** - Architettura moderna con gestione dello stato

## 🚀 Tecnologie Utilizzate

- **Angular 20** con Standalone Components
- **Firebase Authentication**
- **Google Sheets API** 
- **Google Identity Services (GIS)**
- **Bootstrap 5**
- **TypeScript**
- **PWA Service Worker**

## 📱 Come Installare

1. Visita l'app dal tuo smartphone
2. Clicca su "Aggiungi alla schermata home"
3. L'app si installerà come PWA nativa

## 🛠️ Sviluppo

### Prerequisiti
- Node.js 18+
- Angular CLI 20+

### Setup
```bash
npm install
ng serve
```

### Build
```bash
ng build --configuration production
```

## 📋 Utilizzo

1. **Login** con il tuo account Google
2. **Autorizza** l'accesso a Google Sheets e Drive
3. **Aggiungi spese** con data, importo, categoria e descrizione
4. **Visualizza** tutte le spese salvate automaticamente nel tuo Google Sheet privato

## 🔧 Configurazione

L'app utilizza Firebase per l'autenticazione e Google Sheets API per il salvataggio dei dati.
Tutte le configurazioni sono nel file `src/environments/environment.ts`.

---

Creato con ❤️ per imparare Angular, NgRx e RxJS
