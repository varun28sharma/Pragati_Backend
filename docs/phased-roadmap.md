# Pragati Backend Rollout Plan

## Phase 0 – Foundation (this PR)
- Stand up a Node.js 20 + TypeScript + Express service skeleton.
- Configure Prisma ORM against MySQL with schema mirroring `docs/data-model.md`.
- Provide health check and configuration loading (dotenv) to unblock deployment automation.

## Phase 1 – Core Entities & Notifications
- CRUD for schools, classrooms, students, teachers, subjects via Prisma routers.
- Notification issuer endpoint that accepts either an array of student IDs or reusable student groups, writing to `notification_targets` accordingly.
- Basic validation middleware plus OpenAPI contract stub.

## Phase 2 – Attendance & Exams
- Attendance session scheduling, student attendance recording APIs, and summary endpoints (per day, per student).
- Exam creation, student exam result ingest, and report endpoints (latest score per subject, grade distributions).
- Background job to compute attendance/exam aggregates for dashboards.

## Phase 3 – Observability & Hardening
- Authentication/authorization (JWT + role claims).
- Notification delivery adapters (email/SMS/push) with retry tracking.
- Comprehensive integration tests, caching strategy, and performance profiling.

Each phase builds on the prior migrations and keeps Prisma schema as the single source of truth for MySQL tables.
