/**
 * Bespoke Technologies — Shared Constants
 */

export const SITE_NAME = "Bespoke Technologies";
export const SITE_SHORT_NAME = "Bespoke Tech";
export const SITE_TAGLINE =
  "Engineering the solutions for this, and The Next Generations_";
export const SITE_CREED =
  "For Honor and For Excellence. Engineering the solutions for this, and The Next Generations_";
export const SITE_DESCRIPTION =
  "Bespoke Technologies - Perfectionist engineers, building websites, mobile apps, SaaS platforms, AI systems, automation, and business software with production discipline.";
export const SITE_DOMAIN = "www.bespoketech.com.ng";
export const SITE_URL = `https://${SITE_DOMAIN}`;
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const PHONE_NUMBER = "08088071657";
export const PHONE_DISPLAY = "08088071657";
export const WHATSAPP_NUMBER = "2348088071657";
export const CONTACT_EMAIL = "support@bespoketech.com.ng";
export const SOCIAL_HANDLE = "@bespoketech_"; //Facebook, Instagram and Tik Tok
export const BRAND_ICON_SRC = "/icons/bespoke-technologies-icon.png";
export const BRAND_LOGO_SRC = "/icons/bespoke-technologies-logo-main.png";
export const WHATSAPP_INQUIRY_MESSAGE =
  "Hello Bespoke Technologies, I'd like to enquire about your engineering services. Please can you help me?";

// ── Leadership ─────────────────────────────────────────────────────────────
// Kept intentionally brief and factual — no unverified background details.
export const FOUNDER = {
  name: "Kingsley Maduabuchi",
  title: "Founder & CEO",
  role: "Leads engineering and delivery at Bespoke Technologies.",
  ethos:
    "Engineering-first and hands-on: builds practical, intelligent, secure, scalable, and future-ready systems that just work — guided by the creed \"For Honor and For Excellence\".",
  accountability:
    "Keeps one accountable team behind every build. Clients fully own their code, documentation, and deployment.",
} as const;

export const NAV_LINKS = [
  {label: "Home", href: "/"},
  { label: "Services", href: "/services" },
  { label: "Bespoke AI", href: "/bespoke-ai" },
  { label: "Projects", href: "/projects" },
  { label: "Library", href: "/library" },
  { label: "Partnership", href: "/partnerships" },
  { label: "Reviews", href: "/reviews" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

// ── Stats ──────────────────────────────────────────────────────────────────

export const STATS = [
  { value: "18+", label: "Projects Delivered" },
  { value: "3–4 Wks", label: "Est. Delivery" },
  { value: "2+", label: "Years of Excellence" },
  { value: "99%", label: "Client Satisfaction" },
] as const;

export const PRODUCT_OUTCOMES = [
  {
    id: "validate",
    title: "Validate before building",
    description:
      "Clarify scope, users, and the highest-value release before engineering expands.",
  },
  {
    id: "launch",
    title: "Launch on production foundations",
    description:
      "Security, testing, deployment, and operational visibility are built into delivery.",
  },
  {
    id: "own",
    title: "Operate without technical lock-in",
    description:
      "Receive the codebase, documentation, and a system your team can confidently own.",
  },
] as const;

export const DELIVERY_PROCESS = [
  {
    step: "01",
    title: "Discover & Scope",
    description:
      "Align the business outcome, users, constraints, and release plan.",
  },
  {
    step: "02",
    title: "Design & Validate",
    description:
      "Prototype the critical journey and resolve product risk before build.",
  },
  {
    step: "03",
    title: "Build & Launch",
    description:
      "Engineer, test, secure, deploy, and hand over the complete system.",
  },
] as const;

export const ENGAGEMENT_PATHS = [
  {
    id: "launch-sprint",
    title: "SaaS Launch Sprint",
    description:
      "For validated ideas that need a focused, production-minded first release.",
    bestFor: "MVP definition and launch",
    path: "Scope → Prototype → Build",
  },
  {
    id: "product-build",
    title: "Product Build",
    description:
      "For businesses ready to engineer a complete production system.",
    bestFor: "Full platforms and business software",
    path: "Architecture → Delivery → Handover",
  },
  {
    id: "product-partnership",
    title: "Product Partnership",
    description:
      "For teams that need ongoing product and engineering capacity.",
    bestFor: "Iteration, growth, and scale",
    path: "Roadmap → Releases → Optimisation",
  },
] as const;

// ── Services ───────────────────────────────────────────────────────────────

export const SERVICES = [
  {
    id: "web",
    icon: "web",
    title: "Web Development",
    tagline: "Scalable full-stack applications",
    description:
      "We architect and build production-grade web applications using Next.js, React, and modern full-stack technologies — optimised for performance, security, and scale.",
    features: [
      "Next.js & React (App Router)",
      "TypeScript with strict types",
      "REST & GraphQL APIs",
      "Lighthouse score > 95",
    ],
    tech: ["Next.js", "React", "TypeScript", "Node.js"],
  },
  {
    id: "mobile",
    icon: "mobile",
    title: "Mobile Development",
    tagline: "Native and cross-platform apps",
    description:
      "We build robust mobile applications using React Native and Expo — delivering App Store-quality experiences for both iOS and Android from a single codebase.",
    features: [
      "React Native & Expo",
      "iOS & Android from one codebase",
      "Offline-first architecture",
      "Push notifications & deep links",
    ],
    tech: ["React Native", "Expo", "iOS", "Android"],
  },
  {
    id: "cloud",
    icon: "cloud",
    title: "Cloud & Infrastructure",
    tagline: "Resilient, zero-downtime architectures",
    description:
      "We design and implement cloud-native infrastructure on AWS, GCP, and Azure — using Kubernetes, Terraform, and CI/CD pipelines for zero-downtime deployments.",
    features: [
      "Kubernetes orchestration",
      "Terraform infrastructure as code",
      "GitHub Actions CI/CD",
      "99.99% uptime Servic Layer Agreements",
    ],
    tech: ["AWS", "GCP", "Kubernetes", "Terraform"],
  },
  {
    id: "ai",
    icon: "ai",
    title: "AI & Machine Learning",
    tagline: "Intelligent systems, practical impact",
    description:
      "We integrate AI capabilities into real products — from LLM-powered features and RAG pipelines to predictive analytics and computer vision systems.",
    features: [
      "LLM integration & fine-tuning",
      "RAG & vector search pipelines",
      "Predictive analytics",
      "Computer vision systems",
    ],
    tech: ["Python", "PyTorch", "OpenAI", "LangChain"],
  },
  {
    id: "api",
    icon: "api",
    title: "API & Backend Engineering",
    tagline: "High-throughput, documented backends",
    description:
      "We engineer secure, fully documented REST and GraphQL APIs using NestJS, Go, and CockroachDB for enterprise-grade reliability and multi-tenant scale.",
    features: [
      "OpenAPI / Swagger documentation",
      "Multi-tenant architecture",
      "Rate limiting & security hardening",
      "Real-time with WebSockets",
    ],
    tech: ["NestJS", "Go", "CockroachDB", "Redis"],
  },
  {
    id: "design",
    icon: "design",
    title: "UI/UX Design",
    tagline: "Design systems that endure",
    description:
      "We create pixel-perfect, accessible design systems and user interfaces that reflect brand excellence — from wireframes through to production-ready component libraries.",
    features: [
      "Design system architecture",
      "Component libraries (Figma → code)",
      "WCAG AA accessibility",
      "Interaction design & prototyping",
    ],
    tech: ["Figma", "Tailwind CSS", "Framer", "Storybook"],
  },
] as const;

// ── Company Values ─────────────────────────────────────────────────────────

export const VALUES = [
  {
    id: "honor",
    icon: "🤝",
    title: "Honor",
    description:
      "Our word is our bond. We operate with unwavering integrity in every client relationship, every line of code, and every decision we make.",
  },
  {
    id: "excellence",
    icon: "⭐",
    title: "Excellence",
    description:
      "Mediocrity is not an option. We hold ourselves to the highest engineering and design standards — building products worthy of the next generation.",
  },
  {
    id: "innovation",
    icon: "💡",
    title: "Innovation",
    description:
      "We push the boundaries of the technologically possible. Every project is an opportunity to advance the state of the art.",
  },
  {
    id: "impact",
    icon: "🌍",
    title: "Generational Impact",
    description:
      "We build solutions that matter — not just for today, but for the generations that follow. Long-term thinking defines every architecture decision.",
  },
  {
    id: "craftsmanship",
    icon: "🔨",
    title: "Craftsmanship",
    description:
      "Every component, API endpoint, and pixel receives the same deliberate care. We take genuine pride in the quality of our craft.",
  },
  {
    id: "partnership",
    icon: "🔗",
    title: "True Partnership",
    description:
      "We embed ourselves in your mission. Your success is our success — we are not a vendor, we are an engineering partner genuinely invested in your outcome.",
  },
] as const;

// ── Testimonials ───────────────────────────────────────────────────────────

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  initials: string;
  rating: number;
}

export interface ClientStory extends Testimonial {
  challenge: string;
  delivery: string;
  outcome: string;
}

/**
 * Real, verified client testimonials only. This list stays empty until genuine
 * client feedback has been collected and approved for publication — the public
 * reviews page and home carousel render an honest empty state until then.
 */
export const TESTIMONIALS: readonly Testimonial[] = [];

export const CLIENT_STORIES: readonly ClientStory[] = [];

// ── Partners ───────────────────────────────────────────────────────────────

export const PARTNERS = [
  {
    id: "vercel",
    name: "Vercel",
    description:
      "Powering every Bespoke Technologies frontend deployment with instant global edge delivery and zero infrastructure overhead.",
    tier: "strategic" as const,
    websiteLink: "https://vercel.com",
    logo: "https://cdn.simpleicons.org/vercel/000000",
  },
  {
    id: "railway",
    name: "Railway",
    description:
      "Our preferred infrastructure for NestJS and backend deployments — reliable, scalable, and developer-first.",
    tier: "technology" as const,
    websiteLink: "https://railway.app",
    logo: "https://cdn.simpleicons.org/railway/0B0D0E",
  },
  {
    id: "cockroachdb",
    name: "CockroachDB",
    description:
      "The distributed SQL backbone for our multi-tenant SaaS platforms — globally consistent with zero-downtime deployments.",
    tier: "technology" as const,
    websiteLink: "https://cockroachlabs.com",
    logo: "https://www.postbeyond.com/wp-content/uploads/2022/12/Cockroach_Labs_Logo-2.png",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    description:
      "Every client project we deploy is secured and accelerated at the edge — DDoS protection, CDN, and zero-trust networking.",
    tier: "strategic" as const,
    websiteLink: "https://cloudflare.com",
    logo: "https://cdn.simpleicons.org/cloudflare/F38020",
  },
  {
    id: "stripe",
    name: "Stripe",
    description:
      "Our billing infrastructure of choice — handling subscriptions, one-time payments, and marketplace splits across client platforms.",
    tier: "community" as const,
    websiteLink: "https://stripe.com",
    logo: "https://cdn.simpleicons.org/stripe/635BFF",
  },
  {
    id: "github",
    name: "GitHub",
    description:
      "Where Bespoke Technologies code lives — our CI/CD pipeline, code reviews, and collaboration workflow run entirely on GitHub.",
    tier: "community" as const,
    websiteLink: "https://github.com",
    logo: "https://cdn.simpleicons.org/github/181717",
  },
] as const;

export const PARTNERSHIP_TIERS = [
  {
    id: "strategic",
    name: "Strategic",
    description:
      "A B2B revenue-sharing alliance. You bring us a project — we deliver it and share 10% of the revenue with you. We bring you an opportunity — you deliver it and share 10% with us. Mutual skin in the game.",
    benefits: [
      "10% revenue share on referred projects — both ways",
      "Formal partnership agreement included",
      "Bi-directional business referral network",
      "Joint performance tracking & reporting",
      "Dedicated partnership liaison",
      "Priority access to Bespoke Technologies engineering capacity",
    ],
    highlighted: true,
  },
  {
    id: "co-development",
    name: "Co-development",
    description:
      "Deep technical integration and joint go-to-market programs with Bespoke Technologies' core engineering team — building products and solutions together.",
    benefits: [
      "Co-development on joint engineering projects",
      "Joint marketing & co-branded case studies",
      "Early access to Bespoke Technologies solutions & tooling",
      "Dedicated partnership manager",
      "Revenue sharing programs on applicable projects",
    ],
    highlighted: false,
  },
  {
    id: "technology",
    name: "Technology",
    description:
      "Technology integration, ecosystem collaboration, and access to Bespoke Technologies' developer network — amplifying your tools in everything we build.",
    benefits: [
      "API & SDK integration into Bespoke Technologies-delivered projects",
      "Technical documentation access & support",
      "Partner portal & developer resources",
      "Quarterly business reviews",
    ],
    highlighted: false,
  },
] as const;

//=========================================
// Projects
//=========================================
export type ProjectType = "web" | "mobile" | "ios" | "desktop" | "web+mobile";

export const PROJECTS = [
  {
    id: "down-below",
    name: "DownBelow Family Health Initiatives",
    type: "web" as ProjectType,
    category: "Health Education Platform",
    description:
      "A public web platform for DownBelow Family Health Initiatives with Dr. Didi, a faith-grounded family health ministry sharing reliable guidance on relationships, sexuality, reproductive health, and community outreach.",
    image: "/projects/downbelow.png",
    liveUrl: "https://www.down-below.com",
    tags: ["Health Education", "Family Wellness", "Community Outreach"],
    year: "2026",
    comingSoon: false,
    featured: true,
  },
  {
    id: "savemi",
    name: "SAVEMI",
    type: "web" as ProjectType,
    category: "Religion and Doctrinal Mentorship",
    description:
      " SAVEMI — Sabbath Vesper Ministry website built to demostrate teh beauty and goodness in the seventh-day sabbath.",
    image: "/projects/savemi.jpg",
    liveUrl: "https://www.savemi-five.vercel.app",
    tags: ["Religion", "Sabbath Rest", "Repose", "Reflection", "Restoration"],
    year: "2026",
    comingSoon: false,
    featured: true,
  },
  {
    id: "graviloch-finishing",
    name: "Graviloch Finishing Ltd",
    type: "web" as ProjectType,
    category: "Interior Services",
    description:
      "A premium web presence for an interior finishing and construction company, showcasing completed projects, service offerings, and enabling quote requests.",
    image: "/projects/graviloch-finishing.png",
    liveUrl: "https://graviloch-finishing.vercel.app",
    tags: ["Next.js", "Tailwind CSS", "Vercel"],
    year: "2025",
    comingSoon: false,
    featured: true,
  },
    {
    id: "maxit-autos",
    name: "Maxit Autos",
    type: "web+mobile" as ProjectType,
    category: "Auto and Renting",
    description:
      "A premium car renting platform built to be fast, effecient and user freindly, with no suprises, except from the ones they get from Maxit for  renting 5 cars in 1 month..",
    image: "/projects/maxit_autos_logo.png",
    liveUrl:"https://maxit-autos.vercel.app/",
    tags: ["Next.js", "React Native", "Stripe"],
    year: "2026",
    comingSoon: false,
    featured: true,
  },
  {
    id: "swift-type",
    name: "Swift Type",
    type: "desktop" as ProjectType,
    category: "Productivity Tool",
    description:
      "An AI Powered and high-performance speed typing platform with competitive leaderboards, customisable drill modes, and detailed WPM analytics for computer professionals and  learners.",
    image: "/projects/swift-type.png",
    liveUrl: "https://swift-type.com.ng",
    tags: ["React", "TypeScript", "Real-time"],
    year: "2026",
    comingSoon: false,
    featured: true,
  },
    {
    id: "chris-ekong",
    name: "Barr. Chris Ekong & Co",
    type: "web" as ProjectType,
    category: "Legal Services",
    description:
      "A distinguished professional web presence for a leading law practice, featuring case portfolio, service listings, and online consultation booking.",
    image: "/projects/barr-chris-ekong-and-co.png",
    liveUrl: "https://kingsley-a1.github.io/Chris-Ekong/",
    tags: ["HTML/CSS", "JavaScript", "Responsive"],
    year: "2023",
    comingSoon: false,
    featured: false,
  },
  {
    id: "sonic-piano",
    name: "Sonic Piano",
    type: "web" as ProjectType,
    category: "Music Education",
    description:
      "An interactive browser-based piano learning application with structured lessons, live key detection, and audio playback feedback.",
    image: "/projects/sonic-piano.jpg",
    liveUrl: "https://kingsley-a1.github.io/Sonic-Pro/index.html",
    tags: ["JavaScript", "Web Audio API", "Canvas"],
    year: "2025",
    comingSoon: false,
    featured: true,
  },
  {
    id: "debranded",
    name: "Debranded",
    type: "web" as ProjectType,
    category: "Brand & Design Studio",
    description:
      "A brand identity and advertising platform, using the power of modern technology, AI, and creative design to elevate brands and engage audiences.",
    image: "/projects/debranded.png",
    liveUrl: "https://debranded.vercel.app",
    tags: ["Next.js", "Sanity CMS", "Motion"],
    year: "2024",
    comingSoon: false,
    featured: true,
  },
  {
    id: "crs-pdvs",
    name: "CRS Pension DVS",
    type: "web" as ProjectType,
    category: "Government Digital Service",
    description:
      "Cross River State Pension Digital Verification System — a secure government portal for Pensioners live verification, streamlining pension administration and verification workflows.",
    image: "/projects/crs-pdvs.png",
    liveUrl: "https://kingsley-a1.github.io/crs-pdvs",
    tags: ["Next.js", "PostgreSQL", "Authentication"],
    year: "2023",
    comingSoon: false,
    featured: false,
  },
  {
    id: "king-bloggers",
    name: "King Bloggers",
    type: "web" as ProjectType,
    category: "Content Platform",
    description:
      "A multi-author blogging platform with rich text editing, topic tagging, SEO optimisation, and reader engagement analytics.",
    image: "/projects/king-bloggers.png",
    liveUrl: "https://king-bloggers.vercel.app",
    tags: ["Next.js", "MDX", "Supabase"],
    year: "2023",
    comingSoon: false,
    featured: false,
  },
  {
    id: "luminary-college",
    name: "Luminary College",
    type: "web" as ProjectType,
    category: "Education Platform",
    description:
      "A modern education website for Luminary College, showcasing programs, admissions guidance, campus life, and student success stories with a polished, inspiring experience.",
    image: "/projects/luminary-college.png",
    liveUrl: "https://luminary-colledge.vercel.app/",
    tags: ["Next.js", "Education", "Admissions"],
    year: "2026",
    comingSoon: false,
    featured: true,
  },
  {
    id: "scents-by-cherry",
    name: "Scents by Cherry",
    type: "web" as ProjectType,
    category: "E-commerce & Lifestyle",
    description:
      "A refined online storefront for Scents by Cherry, highlighting luxury candles, fragrance collections, and a seamless shopping experience for discerning customers.",
    image: "/projects/scents-by-cherry.png",
    liveUrl: "https://scents-by-cherry.vercel.app/",
    tags: ["Next.js", "E-commerce", "Lifestyle"],
    year: "2026",
    comingSoon: false,
    featured: true,
  },
  {
    id: "coolest",
    name: "Coolest",
    type: "web" as ProjectType,
    category: "All-in-One Media Player",
    description:
      "A feature-rich browser-based media player supporting vidoe, audio, image, file and documents of any type, with elegant and  minimal interface and seamless playback experience.",
    image: "/projects/coolest.png",
    liveUrl: "https://coolest-six.vercel.app",
    tags: ["React", "HTML5 Media API", "Web APIs"],
    year: "2024",
    comingSoon: false,
    featured: false,
  },
  {
    id: "val-link",
    name: "Val Link",
    type: "web" as ProjectType,
    category: "Link Management",
    description:
      "A creative Valentine Experience — a seamless platform for sharing love and appreciation with personalised messaging collections, custom domains, and heartfelt messages.",
    image: "/projects/val-link.svg",
    liveUrl: "https://val-link.vercel.app",
    tags: ["Next.js", "Analytics", "Redis"],
    year: "2023",
    comingSoon: false,
    featured: false,
  },
  {
    id: "kings-queens-lounge",
    name: "Kings & Queens Lounge",
    type: "web" as ProjectType,
    category: "Restaurant & Lounge",
    description:
      "A world-class fine dining and lounge experience platform for Calabar's premier restaurant — featuring live menu browsing, table reservations, private event booking, and a full online ordering system.",
    image: "/projects/king-and-queens.png",
    liveUrl: "https://kingsley-a1.github.io/kings-queens-lounge/",
    tags: ["HTML/CSS", "JavaScript", "PWA"],
    year: "2025",
    comingSoon: false,
    featured: true,
  },
  {
    id: "sunflour-bakery",
    name: "Sunflour Bakery",
    type: "web" as ProjectType,
    category: "Food & E-commerce",
    description:
      "A fresh and vibrant storefront for Calabar's favourite artisan bakery — with a full product catalogue spanning breads, cakes, pastries and fast food, online ordering, event catering requests, and local delivery.",
    image: "/projects/sunflour-bakery.png",
    liveUrl: "https://kingsley-a1.github.io/sunflour-bakery/",
    tags: ["HTML/CSS", "JavaScript", "PWA"],
    year: "2025",
    comingSoon: false,
    featured: true,
  },
  {
    id: "decode",
    name: "Decode",
    type: "web" as ProjectType,
    category: "Developer Utility",
    description:
      "A multi-tool web utility for generating and scanning high-fidelity QR codes with custom styles and logos, encoding and decoding ciphers, checking links for safety heuristics, and shortening long URLs — all in one clean interface.",
    image: "/projects/decode.png",
    liveUrl: "https://kingsley-a1.github.io/decode",
    tags: ["JavaScript", "QR Code", "Web APIs"],
    year: "2025",
    comingSoon: false,
    featured: false,
  },
  {
    id: "reign",
    name: "Reign",
    type: "web+mobile" as ProjectType,
    category: "Fashion & Lifestyle",
    description:
      "A premium fashion brand platform with lookbook galleries, exclusive product drops, influencer collaboration features, and a native mobile companion app.",
    image: "/projects/reign.jpg",
    liveUrl: undefined,
    tags: ["Next.js", "React Native", "Stripe"],
    year: "2025",
    comingSoon: true,
    featured: true,
  },
  {
    id: "velo",
    name: "Velo",
    type: "mobile" as ProjectType,
    category: "Logistics & Delivery",
    description:
      "A real-time logistics and delivery management mobile app connecting drivers, dispatchers, and customers with live tracking and notifications.",
    image: "/projects/velo.png",
    liveUrl: undefined,
    tags: ["React Native", "Expo", "WebSocket"],
    year: "2025",
    comingSoon: true,
    featured: true,
  },
];
