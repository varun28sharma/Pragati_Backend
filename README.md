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

## Scripts
- `npm run dev` – start the API with live reload.
- `npm run build` – emit compiled JS to `dist/`.
- `npm start` – run the compiled server.
- `npm run lint` – ESLint over `.ts` sources.
- `npm run typecheck` – strict TypeScript compile without emit.

## API Overview
Base path: `/api`

| Domain | Prefix | Key endpoints |
| --- | --- | --- |
| Health | `/api/health` | Service heartbeat |
| Core entities | `/api/core` | `POST /schools`, `/grades`, `/sections`, `/classrooms`, `/teachers`, `/subjects`, `/students`, `GET /students/:id` |
| Enrollment | `/api/enrollment` | `POST /teacher-subjects`, `/student-subjects`, `/student-groups`, `/student-groups/:groupId/members` |
| Attendance | `/api/attendance` | `POST /sessions`, `/sessions/:sessionId/records`, `GET /students/:studentId` |
| Assessments | `/api/assessments` | `POST /exams`, `/exam-results`, `GET /students/:studentId/latest` |
| Notifications | `/api/communications` | `POST /notifications`, `GET /notifications/active` |

Refer to `docs/data-model.md` for table-level details and to `docs/phased-roadmap.md` for the rollout plan.
