# Nestly — Milestone-Wise Execution Plan

> This document breaks each milestone into granular, ordered execution steps.
> Every step specifies **what to do**, **which files** to create or modify, and **what commands** to run.
> Steps within a milestone are sequential — complete each before moving to the next.

---

## Milestone 1 — Scaffold & Deploy Empty Shell

**Goal**: Both apps run locally and deploy to production. Zero features, full pipeline proven.

**Estimated effort**: ~2–3 hours

---

### Step 1.1 — Root project setup

| Action | Details |
|---|---|
| Create `.gitignore` | Node modules, `.env`, dist, prisma generated client, OS files |
| Create `.env.example` | Placeholder values for all env vars |
| Create `README.md` | Project description, tech stack, setup instructions, scripts |
| Initialize git | `git init`, initial commit |

**Files created**:
```
nestly-notion-clone/
├── .gitignore
├── .env.example
└── README.md
```

---

### Step 1.2 — Scaffold client (Vite + React + TypeScript)

| Action | Details |
|---|---|
| Run scaffolding | `npx -y create-vite@latest ./client --template react-ts` |
| Install Tailwind | `npm install -D tailwindcss @tailwindcss/vite` |
| Configure Tailwind | Add Tailwind Vite plugin to `vite.config.ts`, add `@import "tailwindcss"` to `index.css` |
| Configure Vite | Set dev server port (5173), proxy `/api` to backend (3001) |
| Clean boilerplate | Remove default Vite demo content from `App.tsx`, `App.css` |
| Create folder structure | `src/api/`, `src/components/`, `src/hooks/`, `src/stores/`, `src/lib/`, `src/pages/`, `src/types/`, `src/styles/` |

**Commands**:
```bash
npx -y create-vite@latest ./client --template react-ts
cd client
npm install
npm install -D tailwindcss @tailwindcss/vite
```

**Files created/modified**:
```
client/
├── src/
│   ├── styles/index.css          # Tailwind directives + CSS variables (dark theme)
│   ├── App.tsx                    # Minimal shell with "Nestly" branding
│   ├── main.tsx                   # Entry point
│   ├── api/                       # (empty, placeholder)
│   ├── components/                # (empty, placeholder)
│   ├── hooks/                     # (empty, placeholder)
│   ├── stores/                    # (empty, placeholder)
│   ├── lib/                       # (empty, placeholder)
│   ├── pages/                     # (empty, placeholder)
│   └── types/                     # (empty, placeholder)
├── index.html                     # Updated <title> to "Nestly"
├── vite.config.ts                 # Proxy + Tailwind plugin
└── tailwind.config.ts             # Dark mode config
```

**Verify**: `npm run dev` → browser shows Nestly landing page at `localhost:5173`

---

### Step 1.3 — Scaffold server (Express + TypeScript)

| Action | Details |
|---|---|
| Initialize package.json | `npm init -y` in `server/` |
| Install dependencies | express, cors, helmet, cookie-parser, dotenv, zod |
| Install dev dependencies | typescript, tsx, @types/express, @types/cors, @types/cookie-parser, nodemon |
| Create `tsconfig.json` | Strict mode, ES2022 target, NodeNext module resolution |
| Create folder structure | `src/routes/`, `src/controllers/`, `src/services/`, `src/middleware/`, `src/lib/` |
| Create entry point | `src/index.ts` with Express app setup |
| Add npm scripts | `dev` (tsx watch), `build` (tsc), `start` (node dist) |

**Commands**:
```bash
mkdir server && cd server
npm init -y
npm install express cors helmet cookie-parser dotenv zod
npm install -D typescript tsx @types/express @types/cors @types/cookie-parser @types/node nodemon
npx tsc --init
```

**Files created**:
```
server/
├── src/
│   ├── index.ts                   # Express app: cors, helmet, json, cookie-parser, health route, error handler
│   ├── routes/
│   │   └── health.ts              # GET /api/health → { data: { status: "ok", timestamp } }
│   ├── controllers/               # (empty, placeholder)
│   ├── services/                  # (empty, placeholder)
│   ├── middleware/
│   │   └── errorHandler.ts        # Centralized error handler middleware
│   └── lib/
│       └── AppError.ts            # Custom error class (statusCode, code, message)
├── tsconfig.json
├── package.json
└── .env                           # Local only (git-ignored), copy from root .env.example
```

**Verify**: `npm run dev` → `GET http://localhost:3001/api/health` returns `{ "data": { "status": "ok" } }`

---

### Step 1.4 — Server middleware & error handling

| Action | Details |
|---|---|
| `AppError` class | Custom error with `statusCode`, `code`, `message`, `details?` — extends `Error` |
| Error handler middleware | Catches `AppError` → structured JSON response. Catches unknown errors → 500 with generic message. Logs errors. |
| CORS config | Allow `FRONTEND_URL` origin, credentials: true |
| Helmet config | Default helmet with minor CSP adjustments if needed |
| JSON body parser | `express.json({ limit: '1mb' })` |
| Cookie parser | `cookieParser()` middleware |
| 404 handler | Catch-all route returning `{ error: { code: "NOT_FOUND", message: "Route not found" } }` |

**Files modified**: `src/index.ts`, `src/middleware/errorHandler.ts`, `src/lib/AppError.ts`

**Verify**: 
- `GET /api/nonexistent` → 404 with structured error JSON
- `GET /api/health` → 200 with structured success JSON

---

### Step 1.5 — Prisma + PostgreSQL initial setup

| Action | Details |
|---|---|
| Install Prisma | `npm install prisma @prisma/client` in `server/` |
| Initialize Prisma | `npx prisma init` → creates `prisma/schema.prisma` and updates `.env` |
| Write initial schema | User + Workspace models only (enough for M1, RefreshToken and Page added in later milestones) |
| Set DATABASE_URL | Point to local PostgreSQL (or Railway dev DB) |
| Generate + migrate | `npx prisma migrate dev --name init` |
| Create Prisma client singleton | `src/lib/prisma.ts` — single PrismaClient instance with connection handling |

**Commands**:
```bash
cd server
npm install prisma @prisma/client
npx prisma init
# Edit schema.prisma with User + Workspace models
npx prisma migrate dev --name init
```

**Files created/modified**:
```
server/
├── prisma/
│   ├── schema.prisma              # User + Workspace models (initial)
│   └── migrations/                # Auto-generated by Prisma
└── src/
    └── lib/
        └── prisma.ts              # PrismaClient singleton
```

**Initial schema** (subset — M1 only):
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?
  googleId     String?  @unique
  name         String
  avatarUrl    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  workspaces Workspace[]

  @@index([email])
}

model Workspace {
  id        String   @id @default(cuid())
  name      String   @default("My Workspace")
  ownerId   String
  owner     User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([ownerId])
}
```

**Verify**: `npx prisma studio` → opens browser UI showing empty User and Workspace tables

---

### Step 1.6 — Client landing page (dark theme)

| Action | Details |
|---|---|
| Design system CSS variables | Define color palette in `index.css` (dark background, accent colors, text colors) |
| Landing page | "Nestly" logo/text, tagline, two CTA buttons: "Log in" and "Sign up" (link to `/login` and `/register`) |
| Placeholder auth pages | `LoginPage.tsx` and `RegisterPage.tsx` with "Coming soon" text |
| React Router setup | Install `react-router-dom`, set up `BrowserRouter` in `App.tsx` with routes for `/`, `/login`, `/register` |
| Favicon | Simple SVG or emoji-based favicon |

**Commands**:
```bash
cd client
npm install react-router-dom
```

**Files created/modified**:
```
client/src/
├── App.tsx                        # BrowserRouter + Routes
├── styles/index.css               # Dark theme CSS variables, global styles
├── pages/
│   ├── LandingPage.tsx            # Hero with Nestly branding
│   ├── LoginPage.tsx              # Placeholder
│   └── RegisterPage.tsx           # Placeholder
└── public/
    └── favicon.svg                # Nestly icon
```

**Verify**: `npm run dev` → landing page renders with dark theme, navigation to `/login` and `/register` works

---

### Step 1.7 — Local end-to-end verification

| Check | How |
|---|---|
| Client runs | `cd client && npm run dev` → loads at `localhost:5173` |
| Server runs | `cd server && npm run dev` → runs at `localhost:3001` |
| Proxy works | From browser at `localhost:5173`, fetch `/api/health` returns OK (via Vite proxy) |
| Database connected | `npx prisma studio` opens, tables visible |
| Error handling works | `GET /api/nonexistent` returns structured 404 JSON |

---

### Step 1.8 — Deploy to Railway (optional — can defer to later)

| Action | Details |
|---|---|
| Create Railway project | Link GitHub repo, add PostgreSQL service |
| Configure server service | Set build command (`npm run build`), start command (`npm start`), env vars |
| Configure client deploy | Deploy client to Vercel/Netlify with `VITE_API_URL` pointing to Railway backend URL |
| Verify deployed | Hit `/api/health` on production URL |

> **NOTE**: Deployment can be deferred to after Milestone 2 (auth) so you have something more interesting to demo. The scaffold is proven locally at this point.

---

## Milestone 2 — Authentication (Email/Password + Google)

**Goal**: Full auth system — register, login (email + Google), token refresh, logout.

**Estimated effort**: ~5–6 hours

---

### Step 2.1 — Install auth dependencies

**Commands**:
```bash
cd server
npm install bcryptjs jsonwebtoken google-auth-library express-rate-limit
npm install -D @types/bcryptjs @types/jsonwebtoken
```

---

### Step 2.2 — Prisma schema update: RefreshToken

| Action | Details |
|---|---|
| Add `RefreshToken` model | With `tokenHash`, `expiresAt`, relation to User |
| Add `refreshTokens` relation to User | One-to-many |
| Run migration | `npx prisma migrate dev --name add-refresh-tokens` |

**Files modified**: `prisma/schema.prisma`

---

### Step 2.3 — Server lib: JWT helpers + crypto

| File | Contents |
|---|---|
| `src/lib/jwt.ts` | `signAccessToken(userId)`, `verifyAccessToken(token)`, `generateRefreshToken()` (random 32 bytes hex), `hashToken(token)` (SHA-256) |
| `src/lib/env.ts` | Validate required env vars at startup (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `FRONTEND_URL`). Fail-fast with clear error messages. |
| `src/lib/cookies.ts` | `setRefreshCookie(res, token)`, `clearRefreshCookie(res)` — encapsulate cookie options |

**Files created**: `src/lib/jwt.ts`, `src/lib/env.ts`, `src/lib/cookies.ts`

---

### Step 2.4 — Auth service layer

| File | Contents |
|---|---|
| `src/services/auth.service.ts` | `register(email, password, name)`, `login(email, password)`, `googleAuth(idToken)`, `refreshTokens(oldToken)`, `logout(token)` |

**Business logic per method**:

| Method | Logic |
|---|---|
| `register` | Check email uniqueness → bcrypt hash → create User + Workspace (transaction) → generate token pair → store refresh hash → return user + tokens |
| `login` | Find user by email → verify password with bcrypt → generate token pair → store refresh hash → return user + tokens |
| `googleAuth` | Verify Google ID token → extract { sub, email, name, picture } → find user by googleId OR by email → create if new → link if existing email user → generate token pair → return user + tokens |
| `refreshTokens` | Hash incoming token → find matching RefreshToken where not expired → delete old → generate new pair → store new hash → return new tokens |
| `logout` | Hash incoming token → delete matching RefreshToken from DB → done |

---

### Step 2.5 — Auth controller + Zod schemas

| File | Contents |
|---|---|
| `src/controllers/auth.controller.ts` | `register`, `login`, `googleAuth`, `refresh`, `logout` — each validates input with Zod, calls service, sets cookies, sends response |

**Zod schemas**:
```typescript
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});
```

---

### Step 2.6 — Auth routes + rate limiting

| File | Contents |
|---|---|
| `src/routes/auth.ts` | Mount all 5 auth endpoints, apply rate limiter to all |
| `src/middleware/rateLimiter.ts` | `authLimiter`: 10 req / 15 min per IP. `apiLimiter`: 100 req / 15 min per IP. |

**Rate limiter config**:
```typescript
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' } },
});
```

---

### Step 2.7 — Auth guard middleware

| File | Contents |
|---|---|
| `src/middleware/authGuard.ts` | Read `Authorization: Bearer <token>` header → verify JWT → attach `req.userId` → call `next()`. On failure → 401. |

**Extend Express Request type** (in `src/types/express.d.ts`):
```typescript
declare namespace Express {
  interface Request {
    userId?: string;
  }
}
```

---

### Step 2.8 — User routes (profile)

| File | Contents |
|---|---|
| `src/routes/user.ts` | `GET /api/users/me` (authGuard), `PATCH /api/users/me` (authGuard) |
| `src/controllers/user.controller.ts` | Get user by `req.userId`, update name/avatarUrl |
| `src/services/user.service.ts` | `getById(id)`, `update(id, data)` |

---

### Step 2.9 — Mount all routes in index.ts

```typescript
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, authGuard, userRoutes);
app.use('/api/health', healthRoutes);
```

**Verify server**: Test all 5 auth endpoints + 2 user endpoints with curl / Postman / Thunder Client:
- Register → get tokens
- Login → get tokens
- Refresh → get new tokens
- Get profile → user data
- Logout → cookie cleared

---

### Step 2.10 — Client: install frontend dependencies

**Commands**:
```bash
cd client
npm install axios zustand sonner
```

---

### Step 2.11 — Client: API client with interceptor

| File | Contents |
|---|---|
| `src/api/client.ts` | Axios instance: `baseURL = '/api'`. Request interceptor attaches `Bearer` token from Zustand store. Response interceptor: on 401, attempt `/auth/refresh` once, retry original request. On refresh failure, redirect to `/login`. |
| `src/api/auth.ts` | `register(data)`, `login(data)`, `googleLogin(idToken)`, `refresh()`, `logout()` — thin wrappers around API client |

---

### Step 2.12 — Client: auth store (Zustand)

| File | Contents |
|---|---|
| `src/stores/authStore.ts` | State: `user`, `accessToken`, `isAuthenticated`, `isLoading`. Actions: `setAuth(user, token)`, `clearAuth()`, `setLoading(bool)`. |

---

### Step 2.13 — Client: auth pages (Login + Register)

| File | Contents |
|---|---|
| `src/components/auth/LoginForm.tsx` | Email + password fields, submit handler, validation feedback, link to register |
| `src/components/auth/RegisterForm.tsx` | Name + email + password fields, submit handler, link to login |
| `src/components/auth/GoogleSignInButton.tsx` | Load Google Identity Services script, render sign-in button, handle credential response → call `POST /api/auth/google` |
| `src/pages/LoginPage.tsx` | Full-page layout: Nestly branding + LoginForm + GoogleSignInButton |
| `src/pages/RegisterPage.tsx` | Full-page layout: Nestly branding + RegisterForm + GoogleSignInButton |

**Google Sign-In setup**:
- Add Google client script to `index.html`
- Use `google.accounts.id.initialize()` with client ID from env (`VITE_GOOGLE_CLIENT_ID`)
- On credential response, POST the `credential` (ID token) to backend

---

### Step 2.14 — Client: protected route + silent refresh

| File | Contents |
|---|---|
| `src/components/auth/ProtectedRoute.tsx` | Wrapper: if not authenticated, attempt silent refresh. If refresh fails, redirect to `/login`. While loading, show spinner. |
| `src/pages/DashboardPage.tsx` | Placeholder "Welcome to Nestly" page (empty state for now) |

**Update `App.tsx` routes**:
```tsx
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
<Route element={<ProtectedRoute />}>
  <Route path="/" element={<DashboardPage />} />
</Route>
```

---

### Step 2.15 — Client: toast notifications

| File | Contents |
|---|---|
| `src/App.tsx` | Add `<Toaster />` from `sonner` at root level |
| All auth handlers | Show `toast.success()` on login/register, `toast.error()` on failures |

---

### Step 2.16 — Milestone 2 verification

| Test | Expected |
|---|---|
| Register with email/password | Account created, redirected to dashboard, access token in memory |
| Login with existing credentials | Success, redirected to dashboard |
| Login with wrong password | Toast error, stays on login page |
| Register with duplicate email | Toast error |
| Close tab, reopen | Silent refresh restores session (if within 7 days) |
| Click logout | Redirected to login, refresh cookie cleared |
| Google Sign-In (new user) | Account created with Google profile, redirected to dashboard |
| Google Sign-In (existing user) | Logged in, Google ID linked if first Google login |
| Rapid-fire login attempts | Rate limited after 10 attempts |

---

## Milestone 3 — Workspace + Basic Page CRUD

**Goal**: Users see their workspace, create/rename/delete pages, flat sidebar list.

**Estimated effort**: ~4–5 hours

---

### Step 3.1 — Prisma schema update: Page model

| Action | Details |
|---|---|
| Add `Page` model | Full schema from PLAN.md (all fields, indexes) |
| Add `pages` relation to Workspace | One-to-many |
| Run migration | `npx prisma migrate dev --name add-pages` |

---

### Step 3.2 — Auto-create workspace on registration

| Action | Details |
|---|---|
| Modify `auth.service.ts` → `register()` | Wrap User + Workspace creation in `prisma.$transaction` |
| Modify `auth.service.ts` → `googleAuth()` | Same — create Workspace when creating new Google user |

---

### Step 3.3 — Workspace service + controller + routes

| File | Contents |
|---|---|
| `src/services/workspace.service.ts` | `getByUserId(userId)`, `update(id, userId, data)` — with ownership check |
| `src/controllers/workspace.controller.ts` | `list`, `update` — Zod validation on update body |
| `src/routes/workspace.ts` | `GET /api/workspaces`, `PATCH /api/workspaces/:id` — both behind authGuard |

---

### Step 3.4 — Page service (core CRUD)

| File | Method | Logic |
|---|---|---|
| `src/services/page.service.ts` | `list(workspaceId, userId)` | Verify workspace ownership, return all non-deleted pages (minimal fields) |
| | `getById(pageId, userId)` | Fetch page with workspace, verify ownership, compute breadcrumb |
| | `create(workspaceId, userId, data)` | Verify ownership, create page with defaults, compute sortOrder |
| | `update(pageId, userId, data)` | Verify ownership, validate dates if present, update fields |
| | `softDelete(pageId, userId)` | Set `isDeleted = true`, `deletedAt = now()` |

**Breadcrumb computation**: Walk up `parentId` chain collecting `{ id, title, icon }` until `parentId === null`. Reverse to get root-first order. (Simple loop query — fine for v1 tree depths.)

---

### Step 3.5 — Page controller + routes

| File | Contents |
|---|---|
| `src/controllers/page.controller.ts` | `list`, `getById`, `create`, `update`, `softDelete` — each validates with Zod |
| `src/routes/page.ts` | All page endpoints nested under `/api/workspaces/:workspaceId/pages` |

**Zod schemas**:
```typescript
const createPageSchema = z.object({
  parentId: z.string().cuid().optional(),
  title: z.string().max(255).optional(),
  icon: z.string().max(50).optional(),
});

const updatePageSchema = z.object({
  title: z.string().max(255).optional(),
  icon: z.string().max(50).optional(),
  content: z.any().optional(),  // JSON blob, size limited by Express
  parentId: z.string().cuid().nullable().optional(),
  sortOrder: z.string().max(50).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});
```

---

### Step 3.6 — Mount workspace + page routes

```typescript
app.use('/api/workspaces', apiLimiter, authGuard, workspaceRoutes);
// Page routes are nested inside workspace routes or mounted separately
```

**Verify server**: Test all CRUD endpoints via curl/Postman.

---

### Step 3.7 — Client: API layer for workspaces + pages

| File | Contents |
|---|---|
| `src/api/workspaces.ts` | `getWorkspaces()`, `updateWorkspace(id, data)` |
| `src/api/pages.ts` | `getPages(wId)`, `getPage(wId, id)`, `createPage(wId, data)`, `updatePage(wId, id, data)`, `deletePage(wId, id)` |

---

### Step 3.8 — Client: page store (Zustand)

| File | Contents |
|---|---|
| `src/stores/pageStore.ts` | State: `pages[]` (flat), `activePage`, `workspace`. Actions: `setPages`, `addPage`, `updatePage`, `removePage`, `setActivePage`, `setWorkspace`. |

---

### Step 3.9 — Client: AppLayout + Sidebar

| File | Contents |
|---|---|
| `src/components/layout/AppLayout.tsx` | Two-panel layout: sidebar (fixed width) + main content (flex). Outlet for nested routes. |
| `src/components/layout/Sidebar.tsx` | Workspace name (editable), page list, "New page" button, "Trash" link, user profile avatar at bottom |

**Sidebar page list** (flat for now): Each item shows icon + title. Click navigates to `/page/:id`. Active page highlighted.

---

### Step 3.10 — Client: page view + editable title

| File | Contents |
|---|---|
| `src/pages/PageViewPage.tsx` | Fetch page on mount by ID from URL params. Show title, icon, and placeholder for editor. |
| `src/components/pages/PageHeader.tsx` | Editable title (contentEditable or input), icon display with click-to-change. Debounced save on title change. |

---

### Step 3.11 — Client: create + delete flows

| Action | UI |
|---|---|
| Create page | "New page" button in sidebar → calls API → adds to store → navigates to new page |
| Delete page | Hover action on sidebar item or button in page header → calls soft-delete API → removes from store → navigates away |
| Workspace rename | Click workspace name in sidebar → inline edit → PATCH API |

---

### Step 3.12 — Client: update routing

```tsx
<Route element={<ProtectedRoute />}>
  <Route element={<AppLayout />}>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/page/:pageId" element={<PageViewPage />} />
  </Route>
</Route>
```

---

### Step 3.13 — Milestone 3 verification

| Test | Expected |
|---|---|
| Login → see sidebar with workspace name | Workspace loads, sidebar visible |
| Click "New page" | Page created, appears in sidebar, navigated to it |
| Edit page title | Title updates in sidebar in real-time, saves to server |
| Create 3 pages, switch between them | Each loads its own content |
| Delete a page | Removed from sidebar, navigated to another page |
| Rename workspace | Name updates in sidebar header |

---

## Milestone 4 — Nested Sidebar Tree + Navigation

**Goal**: Infinite page nesting, expand/collapse, drag-and-drop, breadcrumbs.

**Estimated effort**: ~5–6 hours

---

### Step 4.1 — Install DnD + fractional indexing

```bash
cd client
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities fractional-indexing
```

```bash
cd server
npm install fractional-indexing
```

---

### Step 4.2 — Server: parentId + sortOrder support

| Action | Details |
|---|---|
| `page.service.ts` → `create()` | Accept `parentId`, compute `sortOrder` (place at end of siblings using `fractional-indexing`) |
| `page.service.ts` → `update()` | Accept `parentId` change (re-parent) and `sortOrder` update (reorder) |
| `page.service.ts` → `getById()` | Return `breadcrumb` array: walk up parent chain |

---

### Step 4.3 — Client: tree builder utility

| File | Contents |
|---|---|
| `src/lib/utils.ts` → `buildTree()` | Takes flat `PageTreeItem[]`, returns nested tree structure. O(n) using a Map. Sorts children by `sortOrder`. |

**Data structure**:
```typescript
interface TreeNode {
  page: PageTreeItem;
  children: TreeNode[];
}
```

---

### Step 4.4 — Client: recursive PageTreeItem

| File | Contents |
|---|---|
| `src/components/pages/PageTreeItem.tsx` | Recursive component: icon + title + expand/collapse chevron + hover actions (new sub-page, delete). Indentation via `paddingLeft = depth * 12px`. Click navigates. Chevron toggles expand/collapse stored in `pageStore.expandedIds`. |

---

### Step 4.5 — Client: drag-and-drop integration

| File | Contents |
|---|---|
| `src/components/layout/Sidebar.tsx` | Wrap tree in `DndContext` + `SortableContext`. Handle `onDragEnd` to compute new `parentId` and `sortOrder`. Optimistic update → PATCH to server. |

**DnD behavior**:
- Drag between siblings → reorder (update `sortOrder`)
- Drag onto another page → re-parent (update `parentId` + `sortOrder`)
- Visual indicator shows drop target and position

---

### Step 4.6 — Client: breadcrumb component

| File | Contents |
|---|---|
| `src/components/pages/PageBreadcrumb.tsx` | Render `breadcrumb[]` from page data as clickable links: `Home > Parent > Current`. Each segment links to `/page/:id`. |

**Mount in `PageViewPage.tsx`** above the page header.

---

### Step 4.7 — Client: sub-page creation

| Action | UI |
|---|---|
| From sidebar | Hover on page item → "+" button → creates child page with `parentId` |
| From page header | "Add sub-page" button → same logic |
| Auto-expand | When creating a child, auto-expand the parent in sidebar |

---

### Step 4.8 — Milestone 4 verification

| Test | Expected |
|---|---|
| Create page, then create sub-page under it | Child appears nested under parent in sidebar |
| Expand/collapse parent | Children toggle visibility |
| Create 3 levels of nesting | All render correctly with indentation |
| Drag page to reorder among siblings | Order persists after refresh |
| Drag page onto another page | Re-parents correctly, tree updates |
| Navigate to deeply nested page | Breadcrumb shows full ancestry chain |
| Click breadcrumb segment | Navigates to that ancestor page |

---

## Milestone 5 — BlockNote Editor Integration

**Goal**: Rich text editing with autosave.

**Estimated effort**: ~3–4 hours

---

### Step 5.1 — Install BlockNote

```bash
cd client
npm install @blocknote/core @blocknote/react @blocknote/mantine @mantine/core @mantine/hooks
```

---

### Step 5.2 — Client: PageEditor component

| File | Contents |
|---|---|
| `src/components/pages/PageEditor.tsx` | Import BlockNote styles. Use `useCreateBlockNote({ initialContent })` hook. Render `<BlockNoteView editor={editor} theme="dark" />`. Wire `onChange` to debounced save. |

**Key implementation details**:
- `initialContent`: Parse `page.content` JSON. If empty array `[]`, let BlockNote use its default.
- `onChange`: Get `editor.document`, debounce 800ms, PATCH to server.
- Re-initialize editor when `pageId` changes (key prop or useEffect).

---

### Step 5.3 — Client: autosave with debounce

| File | Contents |
|---|---|
| `src/hooks/useDebounce.ts` | Generic debounce hook: `useDebounce(callback, delay)` |
| `src/components/pages/PageEditor.tsx` | Use debounce to batch content saves. Track save status: `idle` → `saving` → `saved`. |

---

### Step 5.4 — Client: save status indicator

| Location | Contents |
|---|---|
| `src/components/layout/Topbar.tsx` or `PageHeader.tsx` | Show "Saving…" (with spinner) or "Saved ✓" based on save state. Auto-hide "Saved" after 2 seconds. |

---

### Step 5.5 — Server: content validation

| Action | Details |
|---|---|
| `page.service.ts` → `update()` | Content is already size-limited by Express `json({ limit: '1mb' })`. Optionally validate it's an array (basic shape check). |

---

### Step 5.6 — Milestone 5 verification

| Test | Expected |
|---|---|
| Open page, type text | Text appears in editor |
| Bold, italic, headings | Formatting works via toolbar and markdown shortcuts |
| Slash command (`/`) | Menu appears with block type options |
| Drag blocks to reorder | Blocks reorder within editor |
| Type, wait 1 second | "Saving…" then "Saved ✓" indicator appears |
| Refresh page | Content persists — exact same blocks and formatting |
| Switch between pages | Each page loads its own content |
| Create nested/indented blocks | Tab to indent, Shift+Tab to outdent |
| Checklist, code block, divider | All block types render correctly |

---

## Milestone 6 — Trash, Dates, and Search

**Goal**: Complete all remaining v1 features.

**Estimated effort**: ~4–5 hours

---

### Step 6.1 — Server: trash endpoints

| Endpoint | Logic |
|---|---|
| `GET /pages/trash` | Fetch all pages where `isDeleted = true` in workspace |
| `POST /pages/:id/restore` | Set `isDeleted = false`, `deletedAt = null` |
| `DELETE /pages/:id/permanent` | Recursively find all descendants, delete all permanently from DB |

**Recursive permanent delete**: Use a recursive CTE or application-level loop to find all descendant pages, then `prisma.page.deleteMany({ where: { id: { in: [...ids] } } })`.

---

### Step 6.2 — Client: trash page

| File | Contents |
|---|---|
| `src/pages/TrashPage.tsx` | Fetch trashed pages, display as list with title + deleted date. Each item has "Restore" and "Delete permanently" buttons. |
| `src/api/pages.ts` | Add `getTrash(wId)`, `restorePage(wId, id)`, `permanentDeletePage(wId, id)` |

**Add route**: `/trash` inside protected + AppLayout.
**Add sidebar link**: "Trash" at bottom of sidebar with trash icon.

---

### Step 6.3 — Server: date validation

| Action | Details |
|---|---|
| `page.service.ts` → `update()` | If both `startDate` and `endDate` are provided and non-null, assert `endDate >= startDate`. If violated, throw `AppError(422, 'VALIDATION_ERROR', 'End date must be on or after start date')`. |

---

### Step 6.4 — Client: date range picker

| File | Contents |
|---|---|
| `src/components/pages/DateRangePicker.tsx` | Two date inputs: "Start date" and "End date". Both optional and independently clearable. On change, PATCH to server. Show validation error if `endDate < startDate`. |

**Mount in `PageHeader.tsx`** — show below title as a collapsible "Properties" section.

---

### Step 6.5 — Client: date badges in sidebar

| Action | Details |
|---|---|
| `PageTreeItem.tsx` | If page has `startDate` or `endDate`, show a small badge/chip next to the title. Format: "Jul 24" or "Jul 24 → Jul 31". |

---

### Step 6.6 — Server: search endpoint

| Endpoint | Logic |
|---|---|
| `GET /pages/search?q=` | Validate `q` (1–100 chars). Query: `prisma.page.findMany({ where: { workspaceId, isDeleted: false, title: { contains: q, mode: 'insensitive' } } })`. Return results with breadcrumb for each. |

---

### Step 6.7 — Client: search dialog

| File | Contents |
|---|---|
| `src/components/search/SearchDialog.tsx` | Modal triggered by `Cmd+K` / `Ctrl+K`. Text input at top. Debounced search (300ms). Results list: icon + title + breadcrumb path. Click result → navigate to page + close modal. |
| `src/hooks/useSearch.ts` | Manage search query, debounced API call, results state. |

**Register keyboard shortcut** in `App.tsx` or `AppLayout.tsx`:
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

---

### Step 6.8 — Milestone 6 verification

| Test | Expected |
|---|---|
| Delete page → appears in trash | Removed from sidebar, listed in trash view |
| Restore from trash | Returns to sidebar in original position |
| Permanently delete | Gone from trash, gone from DB, children also deleted |
| Set start date on page | Date badge appears in sidebar |
| Set start + end date | Range badge shows "Jul 24 → Jul 31" |
| Set end date before start date | Validation error, not saved |
| Clear dates | Badge removed |
| Press Cmd+K | Search dialog opens |
| Type query, results appear | Matching pages shown with breadcrumbs |
| Click search result | Navigates to page, dialog closes |
| Search with no results | "No pages found" empty state |

---

## Milestone 7 — Polish, Responsive, & Production Hardening

**Goal**: Ship a production-quality v1.

**Estimated effort**: ~4–5 hours

---

### Step 7.1 — Responsive layout

| Action | Details |
|---|---|
| Sidebar | On screens < 768px: sidebar hidden by default, hamburger button in topbar to toggle. Sidebar overlays content as a drawer. |
| Editor | Full-width on mobile, comfortable padding |
| Auth pages | Stack vertically, max-width container |

---

### Step 7.2 — Loading states

| Location | Type |
|---|---|
| Sidebar page tree | Skeleton lines (3–5 animated placeholder rows) |
| Page editor | Skeleton blocks (3–4 text block placeholders) |
| Search results | Spinner while loading |
| Initial app load | Full-screen Nestly logo with spinner (during silent refresh) |

---

### Step 7.3 — Error boundary

| File | Contents |
|---|---|
| `src/components/ErrorBoundary.tsx` | Class component wrapping main content. On error: shows "Something went wrong" with a "Reload" button. Logs error to console. |

**Wrap** the `<Outlet />` in `AppLayout.tsx` with `<ErrorBoundary>`.

---

### Step 7.4 — Empty states

| Location | Empty State |
|---|---|
| Sidebar (no pages) | Illustration + "Create your first page" button |
| Search (no results) | "No pages match your search" |
| Trash (empty) | "Trash is empty" with a checkmark icon |
| Dashboard (no pages) | Welcome message + "Get started" CTA |

---

### Step 7.5 — Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + K` | Open search |
| `Cmd/Ctrl + N` | Create new page (when in app) |
| `Esc` | Close search dialog / modals |

---

### Step 7.6 — Backend: structured logging

| Action | Details |
|---|---|
| Install `pino` | `npm install pino pino-pretty` (dev: pino-pretty) |
| Create logger | `src/lib/logger.ts` — configured pino instance |
| Request logging middleware | Log: method, path, status, duration, userId (if auth'd), requestId |
| Error logging | Log full error stack on 500s, summary on 4xx |
| Startup logging | Log: port, NODE_ENV, database connection status |

---

### Step 7.7 — Backend: env validation at startup

| Action | Details |
|---|---|
| `src/lib/env.ts` | On import, validate all required vars exist. If any missing, log error and `process.exit(1)`. |

Required vars: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `FRONTEND_URL`, `PORT` (optional, default 3001).

---

### Step 7.8 — Frontend: page titles + meta

| Action | Details |
|---|---|
| `useEffect` in page components | Set `document.title` to page-specific titles: "Login — Nestly", "My Page Title — Nestly", "Trash — Nestly" |

---

### Step 7.9 — Visual polish

| Action | Details |
|---|---|
| Animations | Sidebar expand/collapse: smooth height transition. Page transitions: subtle fade-in. Toast slide-in animation. |
| Typography | Use Inter font (from Google Fonts or bundled via BlockNote). Consistent heading sizes. |
| Hover effects | Sidebar items: subtle background highlight. Buttons: scale + color transitions. |
| Focus states | Visible focus rings on all interactive elements (accessibility). |
| Dark theme refinement | Ensure contrast ratios meet WCAG AA. Consistent use of CSS variables. |

---

### Step 7.10 — Install emoji-mart

```bash
cd client
npm install @emoji-mart/react @emoji-mart/data
```

**Integrate** emoji picker as a popover on icon click in `PageHeader.tsx`. Also allow direct text input for emoji.

---

### Step 7.11 — Final README update

| Section | Contents |
|---|---|
| Overview | What Nestly is, screenshot |
| Tech stack | Full list with versions |
| Getting started | Clone, install, env setup, database, run |
| Project structure | Brief folder overview |
| API reference | Link to PLAN.md or inline summary |
| Deployment | Railway setup guide |
| Contributing | (Optional) |

---

### Step 7.12 — End-to-end testing checklist

| Flow | Test |
|---|---|
| **Auth** | Register → login → refresh → logout (email + Google) |
| **Pages** | Create → rename → edit content → save → reload |
| **Nesting** | Create parent → create child → drag to reorder → breadcrumb check |
| **Trash** | Delete → view in trash → restore → delete permanently |
| **Dates** | Set start → set end → validate end >= start → clear → badge check |
| **Search** | Create pages with known titles → search → verify results → navigate |
| **Responsive** | Resize to mobile → sidebar toggles → editor usable → auth pages stack |
| **Error handling** | Submit invalid data → see validation errors. Disconnect network → see error toasts. |
| **Security** | Access protected route while logged out → redirected. Expired token → auto-refresh. Rate limit hit → 429 error. |

---

## Summary Timeline

| Milestone | Focus | Est. Hours |
|---|---|---|
| **M1** | Scaffold & deploy | 2–3 |
| **M2** | Authentication | 5–6 |
| **M3** | Workspace + page CRUD | 4–5 |
| **M4** | Nested tree + DnD | 5–6 |
| **M5** | BlockNote editor | 3–4 |
| **M6** | Trash, dates, search | 4–5 |
| **M7** | Polish + production | 4–5 |
| **Total** | | **~28–34 hours** |

> Each milestone is independently demoable. After M2, you have a working auth system. After M5, you have a functional Notion-lite. M6 and M7 complete the production polish.
