# Pragati Backend

Node.js + TypeScript service for the Pragati student attendance platform. It uses Express for HTTP handling and Prisma for MySQL persistence, mirroring the schema defined in `docs/data-model.md`.

## Prerequisites
- Node.js 20+
- MySQL 8+

## Setup
1. Install dependencies:
   ```powershell
   npm install
   ```
2. Copy environment template and adjust credentials:
   ```powershell
   Copy-Item .env.example .env
   ```
3. Update `.env` with a valid `DATABASE_URL` (e.g. `mysql://user:pass@localhost:3306/pragati`).
4. Apply the schema to your database:
   ```powershell
   npx prisma migrate deploy
   ```
   Development tip: run `npx prisma migrate dev` when editing the schema so Prisma creates versioned migrations automatically.

## Scripts
- `npm run dev` – start the API with live reload.
- `npm run build` – emit compiled JS to `dist/`.
- `npm start` – run the compiled server.
- `npm run lint` – ESLint over `.ts` sources.
- `npm run typecheck` – strict TypeScript compile without emit.

## Authentication
`POST /api/auth/login` returns the `userId`, role, and linked student/teacher IDs after verifying the email/password hash stored in the `users` table. Until JWT is wired in, pass that `userId` with every protected request via the `x-user-id` header. Most routes also enforce role-based access:

- `ADMIN`/`GOVERNMENT` can manage all schools.
- `TEACHER` is restricted to their `schoolId` and, where applicable, their own `teacherId`.
- `STUDENT` may only access their own records.

Additional admin-only helpers live under `/api/auth/users` for creating accounts and toggling statuses.

## API Overview
Base path: `/api`

| Domain | Prefix | Key endpoints |
| --- | --- | --- |
| Health | `/api/health` | Service heartbeat |
| Auth | `/api/auth` | `POST /login`, `POST /users`, `GET /users`, `PATCH /users/:id/status` |
| Core entities | `/api/core` | `POST /schools`, `/grades`, `/sections`, `/classrooms`, `/teachers`, `/subjects`, `/students`, `GET /students/:id` |
| Enrollment | `/api/enrollment` | `POST /teacher-subjects`, `/student-subjects`, `/student-groups`, `/student-groups/:groupId/members`, `GET /student-groups` |
| Attendance | `/api/attendance` | `POST /sessions`, `/sessions/:sessionId/records`, `GET /students/:studentId`, `GET /students/summary`, `GET /classrooms/:classroomId/summary` |
| Assessments | `/api/assessments` | `POST /exams`, `/exam-results`, `GET /students/:studentId/latest` |
| Notifications | `/api/communications` | `POST /notifications`, `GET /notifications/active` |

Refer to `docs/data-model.md` for table-level details and to `docs/phased-roadmap.md` for the rollout plan.
