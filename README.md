# DiabetaX

**A secure, web-based Diabetes Treatment Outcomes & Safety Research Platform.**

DiabetaX is the software deliverable for the research project *"Evaluate the effectiveness of commonly used anti-diabetic drugs with their long-term side effects."* It collects de-identified patient-reported outcomes on anti-diabetic drug therapy (HbA1c control, side effects, adherence, and quality of life) and surfaces research analytics, with a particular focus on closing the South Asian patient data gap.

### Team

- **R M D L Sarathchandra (Devinda)** — Project lead & research. Drove all healthcare and research work: clinical domain expertise, drug-class definitions, survey design, side-effect framework, and methodology.
- **Sasindu Dilshan Ranwadana** — Technical contributor. Designed and built the full-stack platform (frontend, Supabase backend, RBAC, surveys, analytics, and the ML pipeline integration).
- **Dr. Damayanthi Dahanayake** — Supervisor.

🔗 **Live app:** https://diabeta-x.vercel.app

---

## Features

- **Role-based access control** — `patient`, `research_admin`, `clinician_admin`, and `super_admin` roles, enforced with Supabase Row Level Security.
- **Patient surveys** — multi-step baseline, 3-month, and 6-month follow-up wizards capturing medications, measurements, side effects, lifestyle, and quality of life.
- **Patient insights** — safe, descriptive feedback for participants ("Not medical advice").
- **Admin research suite** — participants, submissions, analytics, data quality, and de-identified exports (audited).
- **Clinical Decision Support (CDS)** — clinician-only, fully audited decision-support module.
- **AI/ML registry** — read-only views of models, predictions, and SHAP-style explanations produced by an external Python pipeline.
- **Authentication** — email/password and Google OAuth (PKCE flow) via Supabase Auth.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| Routing | React Router v6 |
| Styling | Tailwind CSS (dark glass theme) + Framer Motion + Radix UI |
| Data | TanStack Query, Recharts |
| Auth & DB | Supabase (PostgreSQL with RLS, Supabase Auth) |
| Hosting | Vercel (auto-deploy from `main`) |

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (URL + anon key)

### Setup

```bash
git clone https://github.com/sasindudilshanranwadana/DiabetaX.git
cd DiabetaX
npm install
cp .env.example .env   # then fill in your Supabase credentials
npm run dev
```

The app runs at `http://localhost:5173`.

### Environment variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── App.tsx          # App shell + routes
├── main.tsx         # Entry point
├── components/      # UI primitives, effects, and reusable components
├── pages/           # Public, patient, and admin pages
├── hooks/           # Custom React hooks
├── lib/             # Supabase client and utilities
└── types/           # Generated Supabase types (database.ts)
```

## Roles

| Role | Permissions |
|------|-------------|
| `patient` | Own profile and surveys; safe descriptive insights |
| `research_admin` | All de-identified participants, submissions, analytics, exports |
| `clinician_admin` | All research_admin features + the CDS module (audited) |
| `super_admin` | Assign roles, seed medications, manage system settings |

New sign-ups are automatically created as `patient`; a `super_admin` promotes other users from the Settings page.

## Deployment

The app auto-deploys to Vercel from the `main` branch. After changing the database schema, regenerate types:

```bash
supabase gen types typescript --project-id <project-ref> > src/types/database.ts
```

## License

This project is developed for academic research purposes.

---

*Built as part of an academic research project. Patient insights are not medical advice; the CDS module is decision-support only.*
