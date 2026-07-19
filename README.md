# Bespoke Technologies — Frontend

The official marketing website for Bespoke Technologies (BT), built with Next.js 16, React 19, Tailwind CSS v4, and Bespoke Technologies' custom design token system.

## Live Site

**Production:** https://www.bespoketech.com.ng

## Tech Stack

- **Framework:** Next.js 16.2.1 (App Router)
- **UI:** React 19, Tailwind CSS v4 with Bespoke Technologies design tokens
- **Animation:** Motion (motion/react) v12
- **Language:** TypeScript (strict)
- **Package Manager:** pnpm

## Pages

| Route            | Description                                                           |
| ---------------- | --------------------------------------------------------------------- |
| `/`              | Homepage — Hero, Stats, Services, Values, Partners, Testimonials, CTA |
| `/services`      | Full services breakdown with features and tech stack                  |
| `/about`         | Mission, team story, values grid                                      |
| `/partnerships`  | Partnership tiers and current partners                                |
| `/reviews`       | Client testimonials and ratings                                       |
| `/contact`       | Contact form with validation                                          |
| `/design-system` | Bespoke Technologies design token reference                           |
| `/admin`         | Protected Bespoke Technologies operating system                      |

## Admin System

The internal admin system is integrated into this application under `/admin`. It includes named Founder Admin and Admin Manager access, rotating six-digit verification, server-side permissions, audit history, clients, leads, projects, tasks, billing documents, PDFs, payments, recurring schedules, reports, controlled exports, and system settings.

Local development uses explicitly marked seed data until `DATABASE_URL` is supplied. Production fails closed when the admin database, session secrets, named identities, rotating-code secrets, or scheduler secret are missing.

```bash
pnpm admin:totp       # generate one secret for each named administrator
pnpm admin:recovery   # generate offline single-use codes and environment hashes
pnpm admin:verify     # validate the production environment contract
pnpm migrate          # apply CockroachDB migrations after DATABASE_URL is set
```

See [`docs/admin/OPERATIONS.md`](docs/admin/OPERATIONS.md) for setup, deployment, recovery, and verification.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable               | Description                |
| ---------------------- | -------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the frontend |
| `NEXT_PUBLIC_API_URL`  | Backend API URL (Railway)  |
| `DATABASE_URL`         | CockroachDB connection used by AI and the Admin System |

## Build

```bash
pnpm build   # Production build
pnpm start   # Start production server
```

## GitHub

https://github.com/Kingsley-A1/bespoke-technologies-FE

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
