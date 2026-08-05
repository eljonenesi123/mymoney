# Expense Tracker (Portfolio Project)

An everyday expense tracker with a "wow" feature: snap a photo of a receipt and OCR auto-fills the amount and merchant.

## Tech Stack
- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **OCR:** Tesseract.js
- **Notifications:** In-app (web push later)

## Project Structure
```
finance-tracker/
├── client/          # React (Vite) frontend
├── server/          # Express backend
│   ├── models/      # Mongoose schemas (User, Expense, Category, Notification)
│   ├── routes/       # API routes
│   └── index.js
└── README.md
```

## Getting Started

### Backend
```
cd server
npm install
npm run dev
```

### Frontend
```
cd client
npm install
npm run dev
```

## Environment Variables
Copy `.env.example` to `.env` in the `server/` folder and fill in your values.

## Build Order (for reference)
1. Scaffold project + connect MongoDB
2. User creation (name-only) + dashboard shell
3. Manual expense add/list (CRUD)
4. Categories + basic charts
5. Receipt scanning (OCR)
6. In-app notifications
7. Polish + insights page

## Deployment
- Frontend → Vercel / Netlify
- Backend → Render / Railway
- Database → MongoDB Atlas (free tier)
