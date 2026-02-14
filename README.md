# Vedic Chai Pre-Order App

A simple pre-order app where customers:
- select menu items
- pay in advance (simulated)
- receive a unique pickup code

Outlet staff can:
- see paid orders live
- verify pickup code
- mark order as collected

## Quick Start (Mac)

Run one command from this folder:

```bash
./setup-mac.sh
```

This will:
- install Homebrew if needed
- install Node.js if needed
- start the app

Then open:
- Customer app: `http://localhost:3000/customer`
- Outlet dashboard: `http://localhost:3000/outlet`
- Admin dashboard: `http://localhost:3000/admin`

## Manual Run

1. Install Node.js (v18+ recommended).
2. From this folder, run:

```bash
npm start
```

3. Open:
- Customer app: `http://localhost:3000/customer`
- Outlet dashboard: `http://localhost:3000/outlet`
- Admin dashboard: `http://localhost:3000/admin`

## Notes

- Data is in-memory for demo purposes and resets when server restarts.
- Payment is simulated as instant success.

## Mobile App Version

A React Native (Expo) version is available at:

- `/Users/shreedhar/Library/Mobile Documents/com~apple~CloudDocs/Vedic Chai/App/mobile-app`

See:

- `/Users/shreedhar/Library/Mobile Documents/com~apple~CloudDocs/Vedic Chai/App/mobile-app/README.md`

## Separate Installable Mobile Apps

Three independent Expo app targets are available:

1. Customer App
- `/Users/shreedhar/Library/Mobile Documents/com~apple~CloudDocs/Vedic Chai/App/mobile-customer`
- `/Users/shreedhar/Library/Mobile Documents/com~apple~CloudDocs/Vedic Chai/App/mobile-customer/README.md`

2. Outlet App
- `/Users/shreedhar/Library/Mobile Documents/com~apple~CloudDocs/Vedic Chai/App/mobile-outlet`
- `/Users/shreedhar/Library/Mobile Documents/com~apple~CloudDocs/Vedic Chai/App/mobile-outlet/README.md`

3. Admin App
- `/Users/shreedhar/Library/Mobile Documents/com~apple~CloudDocs/Vedic Chai/App/mobile-admin`
- `/Users/shreedhar/Library/Mobile Documents/com~apple~CloudDocs/Vedic Chai/App/mobile-admin/README.md`
# Grab-and-Go-App
