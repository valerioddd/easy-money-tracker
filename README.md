# Easy Money Tracker

A minimal personal finance tracking app built with React Native (Expo). Uses Google Sheets as the data backend - no server required!

## Features

- 🌙 **Dark Theme** - Easy on the eyes, always
- 📊 **Google Sheets Backend** - Your data stored in your Google Drive
- 💰 **Track Income & Expenses** - Simple transaction management
- 📱 **Cross-Platform** - iOS, Android, and Web

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) app on your mobile device (for testing)
- Google account (for Google Sheets integration)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/easy-money-tracker.git
cd easy-money-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm start
```

Scan the QR code with Expo Go (Android) or Camera app (iOS) to run on your device.

### Alternative Commands

```bash
npm run android  # Run on Android emulator/device
npm run ios      # Run on iOS simulator (macOS only)
npm run web      # Run in web browser
```

---

## Google Sheet Setup

Easy Money Tracker uses Google Sheets as its database. Follow these steps to set up your personal data sheet.

### Create New from Master Template

#### Step 1: Access the Master Template

1. Open the master template: [Easy Money Tracker Template](https://docs.google.com/spreadsheets/d/YOUR_TEMPLATE_ID/edit) *(link to be provided)*
2. The template contains 4 pre-configured sheets:
   - **Movements** - Your transactions
   - **Categories** - Income/expense categories
   - **Assets** - Your accounts (bank, cash, etc.)
   - **ChartsBase** - Pre-calculated chart data

#### Step 2: Make Your Own Copy

1. Click **File** → **Make a copy**
2. Choose a name (e.g., "My Money Tracker 2024")
3. Select destination folder in your Google Drive
4. Click **Make a copy**

#### Step 3: Configure Initial Data

1. Open your new spreadsheet
2. Go to the **Assets** sheet:
   - Add your bank accounts, cash wallets, credit cards
   - Set initial balances for each
3. Go to the **Categories** sheet:
   - Review default categories
   - Add/modify categories to match your needs
   - Keep `type` as `income` or `expense`

#### Step 4: Get Your Spreadsheet ID

1. Look at your spreadsheet URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
2. Copy the `SPREADSHEET_ID` portion
3. You'll need this when configuring the app

### Sheet Structure Reference

See [docs/template.md](./docs/template.md) for detailed column specifications, data types, and constraints.

**Key Points:**
- All dates use ISO 8601 format (`YYYY-MM-DD`)
- Transaction `type` is immutable (`income` or `expense`)
- IDs should be unique UUIDs
- Currency uses ISO 4217 codes (`EUR`, `USD`, etc.)

---

## Project Structure

```
easy-money-tracker/
├── App.js              # Main application entry
├── app.json            # Expo configuration
├── index.js            # App registry
├── package.json        # Dependencies
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # Screen components
│   ├── services/       # API services and business logic
│   └── theme/          # Theme configuration
│       ├── colors.js   # Dark theme colors
│       └── index.js    # Theme exports
├── docs/
│   ├── template.md     # Google Sheet template documentation
│   └── error-handling.md  # Error handling and recovery guide
└── assets/             # App icons and images
```

## Documentation

- **[Template Documentation](./docs/template.md)** - Detailed Google Sheet structure and schema
- **[Error Handling Guide](./docs/error-handling.md)** - Error recovery flows and implementation guide

## Theme

The app uses a dark theme by default. Theme colors are defined in `src/theme/colors.js`:

```javascript
import { colors } from './src/theme';

// Usage example
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,  // #121212
    color: colors.textPrimary,           // #FFFFFF
  },
  income: {
    color: colors.income,  // Green
  },
  expense: {
    color: colors.expense, // Red
  },
});
```

---

## Google APIs (Future Implementation)

The app will use the following Google APIs:

### Google Sheets API v4
- Read/write transaction data
- Docs: https://developers.google.com/sheets/api

### Google Drive API v3
- Copy template to user's Drive
- Docs: https://developers.google.com/drive/api

### Authentication
- OAuth 2.0 with Google Sign-In
- Docs: https://developers.google.com/identity

---

## Development

### Tech Stack

- **React Native** with **Expo SDK 54**
- **React 19.1**
- **Google Sheets API** for data storage

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run web` | Run in browser |

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Roadmap

- [x] Google Sheets API integration
- [x] Google Sign-In authentication
- [x] Transaction list screen
- [x] Add/edit transaction screens
- [x] Category management
- [x] Error handling and recovery flows
- [ ] Dashboard with charts
- [ ] Asset/account management
- [ ] Data export functionality
