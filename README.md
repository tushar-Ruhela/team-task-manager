# ⚡ TaskFlow — Team Task Manager

A full-stack, production-grade **Team Task Manager** built as a **Turborepo monorepo** using:

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Backend**: Express.js REST API
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (access token in memory + httpOnly refresh cookie)
- **RBAC**: System roles (Admin/Member) + Project roles (Admin/Member)
- **Package Manager**: pnpm workspaces

---

## 📁 Project Structure

```
team-task-manager/
├── apps/
│   ├── web/         # Next.js 14 frontend  (port 3000)
│   └── api/         # Express.js REST API  (port 5000)
├── packages/
│   ├── db/          # Prisma schema + client
│   └── types/       # Shared TypeScript types
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9 → `npm install -g pnpm`
- PostgreSQL running locally (or use Docker)

### 2. Setup PostgreSQL (Docker — quickest)

```bash
docker run -d \
  --name taskflow-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=team_task_manager \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Install dependencies

```bash
cd team-task-manager
pnpm install
```

### 4. Configure environment

The API `.env` is already pre-configured at `apps/api/.env`. Update `DATABASE_URL` if needed:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/team_task_manager"
JWT_SECRET="super-secret-jwt-key-change-this"
JWT_REFRESH_SECRET="super-secret-refresh-key-change-this"
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

### 5. Run database migration

```bash
pnpm db:migrate
```

Or if using `db push` (faster for dev):

```bash
pnpm db:push
```

### 6. Generate Prisma client

```bash
pnpm db:generate
```

### 7. Run both servers

```bash
# Run API + Web in parallel
pnpm dev

# Or run separately:
pnpm dev:api   # http://localhost:5000
pnpm dev:web   # http://localhost:3000
```

---

## 🔑 API Documentation

### Auth

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/signup` | Register (name, email, password, role) |
| POST | `/api/auth/login` | Login → access token + refresh cookie |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |
| GET | `/api/auth/me` | Get current user |

### Projects

| Method | URL | Access |
|--------|-----|--------|
| GET | `/api/projects` | All my projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project + tasks + members |
| PUT | `/api/projects/:id` | Update (project admin) |
| DELETE | `/api/projects/:id` | Delete (project admin) |
| GET | `/api/projects/:id/members` | List members |
| POST | `/api/projects/:id/members` | Add member (project admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |
| PUT | `/api/projects/:id/members/:userId/role` | Change role |
| GET | `/api/projects/:projectId/users/search?search=` | Search addable users |

### Tasks

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/tasks/my-tasks` | Tasks assigned to me |
| GET | `/api/tasks/projects/:projectId/tasks` | Project tasks |
| POST | `/api/tasks/projects/:projectId/tasks` | Create task |
| GET | `/api/tasks/projects/:projectId/tasks/:id` | Get task |
| PUT | `/api/tasks/projects/:projectId/tasks/:id` | Update task |
| PATCH | `/api/tasks/projects/:projectId/tasks/:id/status` | Update status |
| DELETE | `/api/tasks/projects/:projectId/tasks/:id` | Delete (admin) |

### Dashboard

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/dashboard/stats` | Stats: task counts, overdue, recent |

---

## 🛡️ Role-Based Access

| Action | System Admin | Project Admin | Project Member |
|--------|:---:|:---:|:---:|
| View all projects | ✅ | — | — |
| Create project | ✅ | ✅ | ✅ |
| Update/delete project | ✅ | ✅ | ❌ |
| Manage members | ✅ | ✅ | ❌ |
| Create tasks | ✅ | ✅ | ✅ |
| Update own task | ✅ | ✅ | ✅ |
| Delete any task | ✅ | ✅ | ❌ |

---

## 🗄️ Database Schema

```
User ─────────── ProjectMember ─────── Project
  │                                        │
  └─── Task (assignee) ←─── Task ←────────┘
  └─── Task (creator)
  └─── RefreshToken
```

**Enums:**
- `UserRole`: ADMIN, MEMBER
- `ProjectRole`: ADMIN, MEMBER  
- `TaskStatus`: TODO, IN_PROGRESS, REVIEW, DONE
- `TaskPriority`: LOW, MEDIUM, HIGH, URGENT
- `ProjectStatus`: ACTIVE, ARCHIVED, COMPLETED

---

## 🖥️ Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Login |
| `/signup` | Register (choose Admin/Member) |
| `/dashboard` | Stats, progress charts, recent tasks |
| `/projects` | All projects (searchable) |
| `/projects/new` | Create project with color picker |
| `/projects/[id]` | Kanban board with task management |
| `/projects/[id]/members` | Team management + role control |
| `/my-tasks` | Personal task list with filters |
