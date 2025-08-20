# Mandal Book

Group savings & ledger – Next.js 14, Tailwind, MongoDB, NextAuth.

## Features
- Auth (email/password) with roles (admin, member)
- KYC profile with encrypted Aadhaar/PAN
- Contributions submit, optional Cloudinary proof image
- Admin approvals (verify/reject)
- Dashboard charts (Recharts)
- Admin analytics with filters (month range, image present)
- Audit logs: logins, KYC updates, contribution submits and status changes

## Getting started
1. Install deps
```bash
npm install
```
2. Env vars (.env.local)
```
MONGODB_URI=...
NEXTAUTH_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```
3. Dev
```bash
npm run dev
```

## Key URLs
- /signin, /signup
- /dashboard – charts. Admin sees org totals; members see personal totals
- /contributions – submit and list own contributions
- /admin/contributions – pending approvals
- /admin/analytics – month-wise totals, users, image filters
- /admin/logs – audit logs with filters and pagination

## APIs (selected)
- POST /api/register – create user (pending)
- POST /api/seed-admin – create admin
- POST /api/auth/[...nextauth] – sign in
- GET /api/users/me – current session user
- POST /api/users/kyc – update profile (logs to audit)
- POST /api/contributions – submit; accepts JSON or multipart with `file`
- POST /api/admin/contributions/verify – verify|reject (logs to audit)
- GET /api/contributions/mine – current user list
- GET /api/contributions/pending – admin pending list
- GET /api/dashboard/summary – charts (verified only)
- GET /api/admin/analytics – filters: start, end, hasProof; verified only
- GET /api/admin/logs – filters: action, actor; pagination: page, pageSize

## Cloudinary
- Client upload flow signs via `POST /api/upload/sign`
- Server upload also supported via multipart POST to `/api/contributions` (field `file`)
- Stored under `mandal-book/users/{user-name}/contributions`

## Development notes
- Tailwind + `tailwindcss-animate` for animations; custom gradient utilities in `globals.css`
- Charts rendered on client with dynamic import to avoid SSR issues
- Lint: `npm run lint`
