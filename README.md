# Joineazy – Student, Group & Assignment Management System

A role-based full-stack web application where students form their own groups, manage members, and confirm assignment submissions, while professors post assignments and track group-wise progress.

## Overview

This system supports two roles:

- **Student** — registers/logs in, creates and manages study groups, views assignments posted by professors, opens the shared OneDrive submission link, and confirms submission through a two-step verification flow. Progress is shown per group via a live progress bar.
- **Admin (Professor)** — registers/logs in, posts assignments (title, description, due date, OneDrive link), and monitors submission status for every student and group from a unified dashboard with basic analytics (overall completion rate, per-group performance).

Authentication is JWT-based, with role checks enforced on the backend for every protected route — a student token cannot access admin-only endpoints and vice versa.

## Tech Stack

- **Frontend:** React.js (Vite), Tailwind CSS, Axios, React Router
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Auth:** JSON Web Tokens (JWT), bcrypt for password hashing
- **Containerization:** Docker, Docker Compose

## Setup & Run Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL v14+ (or Docker, see below)
- npm

### Option A — Run locally (without Docker)

**1. Clone the repository**
```bash
git clone <your-repo-url>
cd joineazy-task1
```

**2. Backend setup**
```bash
cd backend
npm install
```
Create a `.env` file (see `.env.example`):

PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<your_postgres_password>
DB_NAME=joineazy
JWT_SECRET=<a_long_random_string>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173

Create the database and load the schema:
```bash
createdb -U postgres joineazy
psql -U postgres -d joineazy -f db/schema.sql
```
Start the backend:
```bash
npm run dev
```
Backend runs at `http://localhost:5000`.

**3. Frontend setup**
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

### Option B — Run with Docker Compose

From the project root:
```bash
docker compose up --build
```
This starts PostgreSQL, the backend (port 5000), and the frontend (port 5173) together, with the schema auto-loaded on first run.

## API Endpoints

All protected routes require a header: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new student or admin |
| POST | `/api/auth/login` | Public | Log in, returns JWT + user info |
| GET | `/api/auth/me` | Authenticated | Get current logged-in user's profile |

### Groups
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/groups` | Student | Create a new group (creator auto-added as member) |
| GET | `/api/groups/mine` | Student | List groups the logged-in student belongs to, with members |
| POST | `/api/groups/:groupId/add-member` | Student (group member) | Add a member by email |
| DELETE | `/api/groups/:groupId/remove-member/:userId` | Student (group member) | Remove a member |
| GET | `/api/groups/all` | Admin | List every group with members |

### Assignments
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/assignments` | Admin | Create an assignment (title, description, dueDate, onedriveLink, targetType, groupIds) |
| PUT | `/api/assignments/:id` | Admin (owner) | Edit an assignment |
| GET | `/api/assignments/admin` | Admin | List assignments created by this admin, with completion progress |
| GET | `/api/assignments/student` | Student | List assignments visible to this student, with their submission status |

### Submissions
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/submissions/:assignmentId/confirm` | Student | Confirm submission (step 2 of the two-step verification) |
| GET | `/api/submissions/:assignmentId` | Admin | Per-student submission status for one assignment, with group name |
| GET | `/api/submissions/analytics` | Admin | Overall completion count + per-group performance breakdown |

## Database Schema & Relationships

### Tables

- **users** — stores both students and admins, differentiated by `role` (`student` | `admin`)
- **groups** — created by a student (`created_by`)
- **group_members** — join table; many-to-many between `users` (students) and `groups`
- **assignments** — created by an admin; `target_type` is `all` or `groups`
- **assignment_groups** — join table used only when an assignment targets specific groups
- **submissions** — one row per (assignment, student) pair; tracks `pending`/`confirmed` status and who confirmed it. Group-level progress is derived by joining `submissions` → `group_members`.

### ER Diagram

```mermaid
erDiagram
    USERS ||--o{ GROUPS : creates
    USERS ||--o{ GROUP_MEMBERS : joins
    GROUPS ||--o{ GROUP_MEMBERS : has
    USERS ||--o{ ASSIGNMENTS : creates
    ASSIGNMENTS ||--o{ ASSIGNMENT_GROUPS : targets
    GROUPS ||--o{ ASSIGNMENT_GROUPS : "targeted by"
    ASSIGNMENTS ||--o{ SUBMISSIONS : has
    USERS ||--o{ SUBMISSIONS : submits

    USERS {
        int id PK
        string name
        string email
        string password
        enum role
    }
    GROUPS {
        int id PK
        string name
        int created_by FK
    }
    GROUP_MEMBERS {
        int id PK
        int group_id FK
        int user_id FK
    }
    ASSIGNMENTS {
        int id PK
        string title
        text description
        timestamp due_date
        text onedrive_link
        enum target_type
        int created_by FK
    }
    ASSIGNMENT_GROUPS {
        int id PK
        int assignment_id FK
        int group_id FK
    }
    SUBMISSIONS {
        int id PK
        int assignment_id FK
        int user_id FK
        enum status
        int confirmed_by FK
    }
```## Architecture Overview

```mermaid
flowchart LR
    subgraph Client
        A[React + Tailwind SPA]
    end
    subgraph Server
        B[Express REST API]
        C[JWT Auth Middleware]
        D[Role-based Route Guards]
    end
    subgraph Database
        E[(PostgreSQL)]
    end

    A -- "Axios calls, JWT in header" --> B
    B --> C
    C --> D
    D --> E
    E --> D
    D --> B
    B -- "JSON responses" --> A
```

**Flow:**
1. The React SPA (Vite build) makes all API calls through a single Axios instance, which automatically attaches the JWT stored in `localStorage` to every request.
2. Express receives the request, and `authenticate` middleware verifies the JWT before any route logic runs.
3. `requireRole('student' | 'admin')` middleware then restricts access based on the token's role claim.
4. Controllers run parameterized SQL queries against PostgreSQL via a connection pool (`pg`), never string-concatenated queries — this prevents SQL injection.
5. Responses are plain JSON; the frontend updates state and re-renders (no server-side rendering).

**Why this separation:** frontend and backend are fully decoupled (separate folders, separate Docker containers) — the frontend only knows the backend's base URL, and could be swapped, redeployed, or scaled independently of the API.

## Key Design Decisions

- **Submissions keyed per-student, not per-group:** each student has their own `submissions` row per assignment. Group-level progress (progress bars, group performance analytics) is computed by joining `submissions` through `group_members` on demand. This satisfies both "student-wise" and "group-wise" tracking from a single source of truth, avoiding data duplication or sync issues between two separate tables.
- **Two-step confirmation is enforced in the UI, finalized by the API:** clicking "Yes, I have submitted" only reveals a second confirm/cancel prompt client-side; the actual `PUT/POST /confirm` call only fires on the second click. This matches the spec's two-step verification requirement while keeping the backend's job simple — one authoritative "confirm" action.
- **JWT stored in localStorage, sent via Authorization header:** stateless auth means the backend doesn't need session storage, simplifying horizontal scaling. Every protected route re-verifies the token and role on the server — the frontend's route guards are UX convenience only, not the actual security boundary.
- **Parameterized queries throughout:** every SQL query uses `$1, $2, ...` placeholders via `pg`, never string concatenation — preventing SQL injection regardless of user input.
- **Assignment targeting (`all` vs `groups`):** when an admin posts an assignment, the backend immediately seeds a `pending` submission row for every relevant student (all students, or only those in the targeted groups). This means progress can be tracked from the moment an assignment is posted, with no null/undefined states to handle on the frontend.

## Deployment Decisions

- **Docker Compose** bundles PostgreSQL, the Express backend, and an nginx-served React build into three containers on one network, so the whole stack starts with a single `docker compose up --build` — no manual environment setup needed to demo the project.
- The Postgres container auto-loads `schema.sql` on first startup via Docker's `docker-entrypoint-initdb.d` convention, removing a manual setup step for anyone running the project fresh.
- The frontend's production Docker image is a **multi-stage build**: Node.js is only used to compile the static bundle; the final image serves it via nginx, keeping the deployed image small and free of dev dependencies.