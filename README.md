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
