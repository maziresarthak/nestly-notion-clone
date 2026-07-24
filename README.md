# Nestly — Notion-Lite Clone

A production-ready Notion-inspired workspace app with nested pages, rich text editing, and a beautiful dark-mode UI.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS v4 |
| **Backend** | Express, TypeScript, Prisma ORM |
| **Database** | PostgreSQL |
| **Auth** | JWT (access + refresh tokens), Google OAuth |
| **Editor** | BlockNote |

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** running locally (or a remote connection string)
- **npm** ≥ 9

### 1. Clone & install

```bash
git clone <repo-url>
cd nestly-notion-clone

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Environment variables

```bash
# Copy the example env file and fill in your values
cp .env.example server/.env
```

Edit `server/.env` with your PostgreSQL connection string and secrets.

### 3. Database setup

```bash
cd server
npx prisma migrate dev --name init
```

### 4. Run locally

```bash
# Terminal 1 — server
cd server && npm run dev

# Terminal 2 — client
cd client && npm run dev
```

- **Client**: http://localhost:5173
- **Server**: http://localhost:3001
- **Health check**: http://localhost:3001/api/health

## Project Structure

```
nestly-notion-clone/
├── client/          # Vite + React SPA
│   └── src/
│       ├── api/         # API client & endpoint wrappers
│       ├── components/  # Reusable UI components
│       ├── hooks/       # Custom React hooks
│       ├── lib/         # Utilities & constants
│       ├── pages/       # Route-level page components
│       ├── stores/      # Zustand state stores
│       ├── styles/      # CSS variables & global styles
│       └── types/       # TypeScript interfaces
├── server/          # Express API
│   ├── prisma/      # Schema & migrations
│   └── src/
│       ├── controllers/ # Request handlers
│       ├── lib/         # Prisma client, AppError, helpers
│       ├── middleware/  # Error handler, auth guard, etc.
│       ├── routes/      # Route definitions
│       └── services/    # Business logic
├── .env.example
├── .gitignore
└── README.md
```

## License

MIT
