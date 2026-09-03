# Centra

**Centra** is a personal finance and budgeting web app that helps you track income, expenses, savings goals, and spending habits — all in one place, with a focus on clean UI and BDT (৳) as the primary currency.

---

## ✨ Features

- **Dashboard (Home)** — balance overview, connected accounts carousel, income vs. expense trend chart, spend breakdown, and a recent transactions list
- **Analytics & Breakdown** — category income vs. expense comparison, expense distribution, and a daily spending calendar
- **Goals & Budgets** — savings milestones and monthly category spending limits
- **Quick Actions** — a single modal for adding transactions, transfers, goals, and budgets
- **Notifications** — in-app notifications panel
- **Authentication** — email/password auth via Supabase, email verification flow, optional PIN lock, and a guest mode for trying the app without an account
- **Dark mode** with a custom theme palette
- **Responsive navigation** — desktop sidebar/dock, mobile bottom nav

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Backend / Auth / DB | Supabase |
| Charts | Recharts |
| Icons | lucide-react |
| Extras | canvas-confetti, clsx, tailwind-merge |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/        # Sign in/up, email verification, PIN lock
│   ├── dashboard/    # Dashboard cards, nav bar, charts
│   ├── home/         # Home screen widgets (balance, transactions, insights)
│   ├── layout/       # AppShell, Sidebar, BottomNav, Header
│   ├── modals/       # Add Action & Notifications modals
│   ├── plan/         # Goals & Budgets screen
│   ├── report/       # Analytics & Breakdown screen
│   ├── settings/     # Settings screen
│   └── ui/           # Shared UI primitives (Button, Modal, Switch, etc.)
├── context/          # AuthContext, FinanceContext
├── db/               # Local storage + seed data helpers
├── lib/              # Supabase client
├── types/            # Shared TypeScript types
├── utils/            # Formatters, theme colors
└── App.tsx           # Root app + auth state routing

supabase/
├── migrations/       # SQL migration files
└── schema.sql        # Full database schema
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/iqbalhasanshanto-dev/fintech-centra.git
cd fintech-centra
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the example file and fill in your Supabase project credentials:
```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase project anon/public API key |

### 4. Set up the database
Run the SQL in `supabase/schema.sql` (or the files in `supabase/migrations/`) against your Supabase project — either via the Supabase SQL editor or the Supabase CLI.

### 5. Run the dev server
```bash
npm run dev
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |

---

## 🔒 Note on Environment Files

Never commit your actual `.env` file — only `.env.example` (with placeholder values) should be tracked in version control.

---

## 📌 Status

Centra is under active development as a personal project.
