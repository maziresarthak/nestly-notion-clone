# Nestly — A Notion-like Workspace

A full-stack, production-grade Notion clone built with React, Node.js, and PostgreSQL. Features a rich block editor, nested page tree with drag-and-drop, real-time search, and a polished dark theme.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Zustand |
| **Editor** | BlockNote (rich text, slash commands, drag blocks) |
| **Drag & Drop** | @dnd-kit (Notion-style static reorder) |
| **Styling** | CSS Variables (dark theme), Inter font |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | JWT (access + refresh tokens), Google OAuth |
| **Logging** | Pino (structured JSON in production) |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A Google OAuth Client ID (for Google sign-in)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/nestly-notion-clone.git
cd nestly-notion-clone

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Environment Setup

**Server** (`server/.env`):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/nestly
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
GOOGLE_CLIENT_ID=your-google-client-id
FRONTEND_URL=http://localhost:5173
PORT=3001
```

**Client** (`client/.env`):
```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Database Setup

```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

### 4. Run Development Servers

```bash
# Terminal 1 — Server
cd server && npm run dev

# Terminal 2 — Client
cd client && npm run dev
```

Open http://localhost:5173

## Project Structure

```
nestly-notion-clone/
├── client/                   # React frontend
│   ├── src/
│   │   ├── api/              # API client functions
│   │   ├── components/       # UI components
│   │   │   ├── auth/         # Login, Register, Google auth
│   │   │   ├── layout/       # AppLayout, Sidebar
│   │   │   ├── pages/        # PageHeader, PageEditor, etc.
│   │   │   └── search/       # SearchDialog
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities
│   │   ├── pages/            # Route pages
│   │   ├── stores/           # Zustand stores
│   │   └── styles/           # Global CSS
│   └── index.html
├── server/                   # Express backend
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── lib/              # Prisma, AppError, logger, env
│   │   ├── middleware/       # Auth guard, rate limiter, logging
│   │   ├── routes/           # Express routers
│   │   └── services/         # Business logic
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── tests/                # API test scripts
├── PLAN.md                   # Architecture plan
└── milestone-wise-execution-plan.md
```

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/google` | Google OAuth sign-in |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (clears refresh token) |

### Pages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces/:wId/pages` | List all pages (sidebar tree) |
| POST | `/api/workspaces/:wId/pages` | Create a page |
| GET | `/api/workspaces/:wId/pages/:id` | Get page with content + breadcrumb |
| PATCH | `/api/workspaces/:wId/pages/:id` | Update title, icon, content, dates, etc. |
| DELETE | `/api/workspaces/:wId/pages/:id` | Soft delete |
| GET | `/api/workspaces/:wId/pages/trash` | List trashed pages |
| POST | `/api/workspaces/:wId/pages/:id/restore` | Restore from trash |
| DELETE | `/api/workspaces/:wId/pages/:id/permanent` | Permanently delete (recursive) |
| GET | `/api/workspaces/:wId/pages/search?q=` | Search pages by title |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workspaces` | List user's workspaces |
| PATCH | `/api/workspaces/:id` | Rename workspace |

## Features

- **Rich block editor** — headings, lists, checklists, quotes, code blocks, dividers
- **Nested pages** — infinite nesting with breadcrumb navigation
- **Drag & drop** — Notion-style static reorder with drop indicator line
- **Auto-save** — debounced content saving with paced status indicator
- **Trash & restore** — soft delete with permanent delete (recursive)
- **Date properties** — start/end dates with sidebar badges
- **Search** — Cmd+K full-text search with breadcrumb results
- **Emoji picker** — emoji-mart integration for page icons
- **Dark theme** — polished dark UI with WCAG AA contrast
- **Responsive** — mobile hamburger drawer, full-width editor
- **Security** — JWT rotation, rate limiting, input validation

## Deployment

### Railway

1. Create a new Railway project
2. Add a PostgreSQL database
3. Add a service for the server (point to `/server`)
4. Add a service for the client (point to `/client`)
5. Set environment variables on each service
6. The server `Dockerfile` or buildpack will run `npx prisma migrate deploy` on start

## License

MIT
