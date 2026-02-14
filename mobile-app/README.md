# Vedic Chai Mobile App

Mobile version of the Vedic Chai pre-order flow built with Expo React Native.

## Features

- Three separate app experiences in one mobile build:
  - Customer App
  - Outlet App
  - Admin Dashboard
- Customer can select menu items and pay in advance.
- App generates a pickup code and QR code after payment.
- Customer can choose payment method (GPay, PhonePe, Paytm, UPI, Card).
- Outlet app verifies pickup code and marks order as collected.
- Admin dashboard shows orders, values, and payment split.
- Header supports outlet name editing and backend URL settings.
- Mobile app can connect directly to backend APIs (`/api/menu`, `/api/orders`, `/api/verify-pickup`, `/api/admin/summary`).
- Outlet/Admin access is protected with role login.
- Outlet name and backend URL are persisted locally on device.

## Run

1. Install Node.js 18+.
2. Install Expo CLI dependencies from this folder:

```bash
cd "/Users/shreedhar/Library/Mobile Documents/com~apple~CloudDocs/Vedic Chai/App/mobile-app"
npm install
```

3. Start the app:

```bash
npm start
```

4. Open in:
- iOS Simulator (`i`)
- Android Emulator (`a`)
- Expo Go app (scan QR from terminal/browser)

## Notes

- Start backend server first from:
  - `/Users/shreedhar/Library/Mobile Documents/com~apple~CloudDocs/Vedic Chai/App`
- In mobile app dashboard, set `Backend URL`:
  - iOS Simulator: `http://localhost:3000`
  - Android Emulator: `http://10.0.2.2:3000`
  - Physical phone: `http://<your-mac-lan-ip>:3000` (same Wi-Fi)
- Demo login credentials:
  - Outlet: `outlet` / `1234`
  - Admin: `admin` / `4321`
