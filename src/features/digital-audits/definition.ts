import type {
  DigitalAuditMaturity,
  DigitalAuditQuestionId,
} from "./types";

export const DIGITAL_AUDIT_DEFINITION_VERSION = "digital-readiness-2026-01";
export const DIGITAL_AUDIT_SCORING_VERSION = "equal-maturity-v1";

export const DIGITAL_AUDIT_INDUSTRIES = [
  "Accounting & Tax",
  "Advertising & Marketing",
  "Agriculture & Agribusiness",
  "Architecture & Engineering",
  "Arts, Culture & Entertainment",
  "Automotive",
  "Aviation & Aerospace",
  "Beauty, Wellness & Fitness",
  "Charity, Nonprofit & NGO",
  "Chemicals & Materials",
  "Construction & Infrastructure",
  "Consulting & Professional Services",
  "Consumer Goods",
  "Crypto, Blockchain & Web3",
  "Cybersecurity",
  "Data & Analytics",
  "Defence & Security",
  "Education & Training",
  "Energy, Oil, Gas & Renewables",
  "Environmental Services & Sustainability",
  "Events & Experiences",
  "Financial Services",
  "Fintech & Payments",
  "Forex & Foreign Exchange",
  "Food & Beverage",
  "Freight, Logistics & Supply Chain",
  "Gaming & Esports",
  "Government & Public Sector",
  "Healthcare & Medical Services",
  "Hospitality & Tourism",
  "Human Resources & Recruitment",
  "Insurance",
  "Legal Services",
  "Manufacturing & Industrial",
  "Media, Publishing & Communications",
  "Mining & Natural Resources",
  "Pharmaceuticals & Biotechnology",
  "Professional Services",
  "Real Estate & Property Management",
  "Religion & Faith Organisations",
  "Retail & Ecommerce",
  "SaaS & Software",
  "Sports & Recreation",
  "Technology & IT Services",
  "Telecommunications",
  "Transportation & Mobility",
  "Utilities & Waste Management",
  "Venture Capital & Private Equity",
  "Wholesale & Distribution",
] as const;

export const DIGITAL_AUDIT_TEAM_SIZES = ["1–5", "6–20", "21–50", "51+"] as const;

export interface DigitalAuditOption {
  label: string;
  maturity: DigitalAuditMaturity;
}

export interface DigitalAuditQuestion {
  id: DigitalAuditQuestionId;
  label: string;
  short: string;
  prompt: string;
  context: string;
  options: readonly [
    DigitalAuditOption,
    DigitalAuditOption,
    DigitalAuditOption,
    DigitalAuditOption,
  ];
}

export const DIGITAL_AUDIT_QUESTIONS: readonly DigitalAuditQuestion[] = [
  {
    id: "presence",
    label: "Digital Presence & Conversion",
    short: "Digital Presence",
    prompt:
      "Which statement best describes how your main digital presence turns visitors into enquiries, bookings or sales?",
    context: "Consider the website, listing or social profile customers actually reach.",
    options: [
      { label: "We have little or no effective digital presence.", maturity: 0 },
      {
        label:
          "Our site or profile explains the basics, but the next step is unclear or rarely tracked.",
        maturity: 1,
      },
      {
        label:
          "Our offer and next step are clear on mobile, and enquiries or bookings arrive reliably.",
        maturity: 2,
      },
      {
        label:
          "We measure the full journey and consistently convert qualified visitors.",
        maturity: 3,
      },
    ],
  },
  {
    id: "acquisition",
    label: "Lead Management",
    short: "Lead Management",
    prompt: "Which statement best describes how new enquiries are captured and followed up?",
    context: "Consider calls, forms, WhatsApp, DMs, referrals and walk-ins together.",
    options: [
      {
        label: "Enquiries arrive in scattered places and some are missed.",
        maturity: 0,
      },
      {
        label: "Most enquiries reach someone, but follow-up depends on individual memory.",
        maturity: 1,
      },
      {
        label: "Enquiries are captured in one place with defined owners and follow-up stages.",
        maturity: 2,
      },
      {
        label:
          "Every enquiry is tracked by source, acknowledged automatically and measured through conversion.",
        maturity: 3,
      },
    ],
  },
  {
    id: "operations",
    label: "Operations & Automation",
    short: "Operations",
    prompt: "Which statement best describes how your recurring weekly work is managed?",
    context: "Think about orders, onboarding, service delivery, administration and reporting.",
    options: [
      {
        label: "Most recurring work depends on WhatsApp, paper or personal spreadsheets.",
        maturity: 0,
      },
      {
        label: "Some tools help, but staff still copy information and coordinate work manually.",
        maturity: 1,
      },
      {
        label: "Core workflows run in dedicated systems with clear owners and steps.",
        maturity: 2,
      },
      {
        label: "Our systems are connected and repetitive steps are automated end-to-end.",
        maturity: 3,
      },
    ],
  },
  {
    id: "data",
    label: "Data & Reporting",
    short: "Data & Reporting",
    prompt:
      "How quickly can leadership get reliable answers about customers, orders, revenue and performance?",
    context: "Think about the numbers used to make weekly or monthly decisions.",
    options: [
      {
        label: "Records live with individuals, so reliable numbers are difficult to obtain.",
        maturity: 0,
      },
      {
        label: "Records span several tools and reports are compiled manually when needed.",
        maturity: 1,
      },
      {
        label: "One primary system holds key records and leadership receives regular reports.",
        maturity: 2,
      },
      {
        label: "A trusted source of truth feeds live reporting for the decisions that matter.",
        maturity: 3,
      },
    ],
  },
  {
    id: "ai",
    label: "AI Readiness",
    short: "AI Readiness",
    prompt:
      "Which statement best describes the information and system foundation available for safe, useful AI?",
    context: "This measures readiness, not whether the business already uses AI.",
    options: [
      {
        label: "Important knowledge lives in people's heads and our systems are disconnected.",
        maturity: 0,
      },
      {
        label: "We have scattered documents and a few inconsistent integrations.",
        maturity: 1,
      },
      {
        label: "Approved knowledge is current and our main systems are connected.",
        maturity: 2,
      },
      {
        label:
          "Knowledge is governed and structured for controlled AI access with human oversight.",
        maturity: 3,
      },
    ],
  },
  {
    id: "security",
    label: "Security & Resilience",
    short: "Security & Resilience",
    prompt:
      "Which statement best describes how access, backups and growth capacity are managed across your critical systems?",
    context: "This is a strategic self-assessment, not a formal security or compliance audit.",
    options: [
      {
        label: "There is no clear owner for access, backups or key-person continuity.",
        maturity: 0,
      },
      {
        label: "Basic controls exist, but recovery is untested and growth would strain the setup.",
        maturity: 1,
      },
      {
        label: "Roles and backups are actively managed, and current growth is planned for.",
        maturity: 2,
      },
      {
        label:
          "Access is tightly controlled, recovery is tested and capacity is monitored before demand.",
        maturity: 3,
      },
    ],
  },
] as const;

export const DIGITAL_AUDIT_RECOMMENDATIONS: Record<
  DigitalAuditQuestionId,
  { title: string; risk: string; move: string; outcome: string }
> = {
  presence: {
    title: "Build a measurable conversion journey",
    risk: "Visitors arrive without a clear, measurable next step.",
    move: "Focus the main customer journey on one action with clear proof and mobile-first execution.",
    outcome: "A digital presence that produces qualified enquiries instead of merely existing.",
  },
  acquisition: {
    title: "Systematise enquiry follow-up",
    risk: "Revenue leaks when follow-up depends on memory.",
    move: "Capture every enquiry in a lightweight CRM with owners, stages and timely follow-up.",
    outcome: "More value from the demand the business already earns.",
  },
  operations: {
    title: "Automate one high-frequency workflow",
    risk: "Manual coordination limits capacity and increases avoidable errors.",
    move: "Move one repetitive workflow into a reliable system before automating the next.",
    outcome: "Freed staff time, cleaner delivery and a repeatable improvement pattern.",
  },
  data: {
    title: "Create one source of operational truth",
    risk: "Decisions rely on delayed or conflicting reports.",
    move: "Consolidate key records and expose a small dashboard of decision-critical metrics.",
    outcome: "Faster, more confident decisions grounded in current business reality.",
  },
  ai: {
    title: "Prepare the foundation before deploying AI",
    risk: "AI built on scattered knowledge produces unreliable outputs.",
    move: "Govern approved knowledge, then introduce one bounded AI use case with human review.",
    outcome: "A useful AI capability that improves as the organisation's information matures.",
  },
  security: {
    title: "Strengthen access, recovery and resilience",
    risk: "A single incident or growth spike could disrupt critical operations.",
    move: "Define access ownership, test restoration and review capacity for critical systems.",
    outcome: "An operation that continues safely through change, growth and recovery.",
  },
};
