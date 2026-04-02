# 📘 Mandal-Book — Group Money Management

Web app for mandals and savings groups: **contributions**, **loans**, **KYC**, **investment invoices**, **PIN‑protected access**, and **Splitwise‑style shared bills** — with admin approvals, UPI slip OCR, and responsive mobile UI.

## 🚀 Features

### 🔐 Authentication & security
- JWT auth, admin / member roles, email OTP on registration
- **4‑digit security PIN** after login (session unlock + verification history)
- Optional production guard against casual DevTools shortcuts (`AntiInspectGuard`)

### ✅ Admin approval workflow
- Members verified by email → admin approves account access
- KYC must be verified for most member modules

### 📋 KYC
- Aadhaar, PAN, bank proof uploads; admin review; status + email updates

### 💰 Monthly contributions
- UPI slip upload, optional cash path, **OCR** for reference / amount / time
- Admin approval; overpayment split across months where configured

### 💳 Loans
- Requests, approval, interest, repayments, notifications

### 🧾 Investment invoices (read‑only members)
- Admin uploads bills (**PDF / image**) to Cloudinary; members view with preview

### ⚖️ Shared bills (Splitwise‑style) — **new tab “Shared bills”**
- Add an expense: **who paid**, **amount**, **date**, **split equally** among selected members (and admin if included)
- **Per‑person balance** (lent vs owed) and **suggested settle‑up payments** (who should pay whom)
- **Activity feed** of group bills; **delete** only for the creator (or admin)
- Mobile‑first layout with bottom sheet + FAB, matching “split app” expectations

### 👥 Members & history
- Member directory, **login history**, **PIN check history** (success / fail)

### 🎨 Dashboards
- Member charts / history; admin overview, queues, fund graphs

## 🛠️ Technology stack

| Area | Stack |
|------|--------|
| App | **Next.js 14** (Pages Router), React, Tailwind CSS |
| API | Next.js API routes, JWT, bcrypt |
| DB | **MongoDB** + Mongoose |
| Media | **Cloudinary** |
| OCR | Tesseract.js |
| Email | Nodemailer |
| State | Redux Toolkit + RTK Query |

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB
- Cloudinary + SMTP (see `.env.local` example below)

### Setup

```bash
git clone <repository-url>
cd mandal
npm install
```

Create **`.env.local`** (example):

```env
MONGODB_URI=mongodb://localhost:27017/group-money-management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@example.com
OTP_EXPIRY_MINUTES=10

CORS_ORIGIN=https://your-domain.com
NEXT_PUBLIC_API_URL=http://localhost:3000
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional demo data:

```bash
npm run seed
```

## 📁 Project structure (high level)

```
mandal/
├── components/       # Layout, PIN modals, previews, guards, …
├── context/         # Auth, theme, language, chat
├── lib/             # api, cloudinary, ocr, splitBalances (shared bills math), …
├── models/          # User, Contribution, Loan, Invoice, SplitExpense, …
├── pages/
│   ├── api/         # auth, admin, contributions, splits, …
│   ├── splits.js    # Shared bills UI
│   ├── invoices.js
│   └── …
├── store/api/       # RTK Query slices (splitsApi, …)
└── styles/
```

## 🔌 API endpoints (extra)

### Shared bills (`SplitExpense`)
- `GET /api/splits` — list expenses, **balances**, **settlements** (auth: approved member or admin)
- `POST /api/splits` — body: `description`, `amount`, `paidBy`, `participantIds[]`, optional `incurredOn`
- `DELETE /api/splits/[id]` — creator or admin

### Other (non‑exhaustive)
- Auth: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, …
- Contributions, loans, KYC, admin overview, invoices, PIN set/verify, login & PIN history — see route files under `pages/api/`.

## 📱 Responsive & PWA‑friendly

Layouts work on **phone, tablet, desktop**; shared bills use a **mobile sheet + FAB** pattern similar to Splitwise.

## 🚀 Deployment

Works on **Vercel** or any Next.js host: set the same env vars as production secrets.

## 📝 License

MIT.

---

**Mandal-Book** — group finance, invoices, and fair expense splits in one place.
