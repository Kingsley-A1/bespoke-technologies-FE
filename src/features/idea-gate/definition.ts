import type { IdeaGateId, IdeaGateScore } from "./types";

/**
 * Public adaptation of the internal Bespoke Technologies Idea Execution Gate
 * (Internal Strategic Framework, Version 1.0). The ten gates, their pass and
 * refine signals and the 0/1/2 evidence scale are unchanged; only the wording
 * is written for people assessing their own idea rather than for the Think
 * Tank briefing a CTO.
 */
export const IDEA_GATE_DEFINITION_VERSION = "idea-execution-gate-v1";
export const IDEA_GATE_SCORING_VERSION = "gate-evidence-v1";

export const IDEA_GATE_PRODUCT_NAME = "Bespoke Idea Execution Gate";
export const IDEA_GATE_TAGLINE = "From Idea to Execution. With Clarity.";
export const IDEA_GATE_PATH = "/idea-execution-gate";

/** A serious idea should reach this before engineering, per the framework. */
export const IDEA_GATE_EXECUTION_BENCHMARK = 16;

export const IDEA_GATE_STAGES = [
  "Just an idea",
  "Researching it",
  "Prototype or pilot",
  "Already live",
] as const;

export const IDEA_GATE_OWNER_ROLES = [
  "Founder",
  "Business owner",
  "Product or project lead",
  "Executive or director",
  "Engineer or technical lead",
  "Student or independent builder",
  "Other",
] as const;

export interface IdeaGateOption {
  label: string;
  score: IdeaGateScore;
}

export interface IdeaGateQuestion {
  id: IdeaGateId;
  number: number;
  /** Short name used in breakdowns, tables and the PDF. */
  label: string;
  question: string;
  context: string;
  evidenceLabel: string;
  evidencePlaceholder: string;
  options: readonly [IdeaGateOption, IdeaGateOption, IdeaGateOption];
  passSignal: string;
  refineSignal: string;
  /** Shown after the gate is answered, to carry momentum into the next one. */
  encouragement: string;
  /** Deterministic improvement guidance used when the gate is not yet strong. */
  focus: { risk: string; move: string; outcome: string };
}

export const IDEA_GATE_QUESTIONS: readonly IdeaGateQuestion[] = [
  {
    id: "problem",
    number: 1,
    label: "The problem",
    question: "What real problem are you solving?",
    context:
      "Name the pain, inefficiency, risk, cost or opportunity — not the features you want to build.",
    evidenceLabel: "Describe the problem in your own words",
    evidencePlaceholder:
      "e.g. Clinics lose two hours a day reconciling paper appointment books with phone bookings.",
    options: [
      { label: "I have an idea, but I have not pinned down the exact problem yet.", score: 0 },
      { label: "I can describe the problem, though I have not confirmed it outside my own view.", score: 1 },
      { label: "The problem is specific and observable, and people affected by it have confirmed it.", score: 2 },
    ],
    passSignal: "The problem is specific, painful, observable and worth solving.",
    refineSignal: "The idea sounds interesting, but the pain is still vague or assumed.",
    encouragement: "Good — a named problem is what everything after this hangs on.",
    focus: {
      risk: "A solution built on an assumed problem can be excellent and still go unused.",
      move: "Write the problem as one sentence, then confirm it with five people who live with it.",
      outcome: "A problem statement you can defend, and that the rest of the plan can follow.",
    },
  },
  {
    id: "user",
    number: 2,
    label: "The user",
    question: "Who exactly needs it?",
    context:
      "Define the user, the buyer, the operator and the beneficiary. Avoid broad labels like \"businesses\" or \"schools\".",
    evidenceLabel: "Describe your first customer",
    evidencePlaceholder:
      "e.g. Private clinics in Calabar with 3–10 staff, where the practice manager buys and the front desk uses it.",
    options: [
      { label: "The audience is still broad — I am describing a category, not a person.", score: 0 },
      { label: "I have a segment in mind, but the buyer and the user are not clearly separated.", score: 1 },
      { label: "I can describe the exact first customer in one sentence, including who pays.", score: 2 },
    ],
    passSignal: "You can describe the exact first customer segment in one sentence.",
    refineSignal: "The audience is too broad, unclear or hard to reach.",
    encouragement: "That focus makes every later decision cheaper to make.",
    focus: {
      risk: "A broad audience makes the product, the pricing and the messaging vague at the same time.",
      move: "Narrow to one first segment and separate who uses it, who pays and who approves.",
      outcome: "A first customer specific enough to design for and to sell to.",
    },
  },
  {
    id: "timing",
    number: 3,
    label: "The timing",
    question: "Why does this matter now?",
    context:
      "Identify the timing pressure: a market shift, regulation, technology change, customer urgency or cultural moment.",
    evidenceLabel: "What makes now the right moment?",
    evidencePlaceholder:
      "e.g. New reporting rules take effect next year and current tools do not produce the required records.",
    options: [
      { label: "It would be useful at any time — nothing makes now particular.", score: 0 },
      { label: "There is a reason to act soon, but I have not evidenced the pressure.", score: 1 },
      { label: "There is a clear, current reason adoption can happen now rather than someday.", score: 2 },
    ],
    passSignal: "There is a reason adoption can happen now, not someday.",
    refineSignal: "The idea is useful, but nothing is creating urgency yet.",
    encouragement: "Timing is what turns a good idea into a used one.",
    focus: {
      risk: "Without urgency, prospects agree it is a good idea and then do nothing.",
      move: "Find the shift — a rule, a cost, a new behaviour — that makes waiting expensive for your user.",
      outcome: "A reason for the first customers to move now rather than later.",
    },
  },
  {
    id: "commercial",
    number: 4,
    label: "Commercial value",
    question: "Is it commercially useful?",
    context:
      "Confirm whether it can make money, save time, reduce cost, increase trust, improve productivity or unlock growth.",
    evidenceLabel: "What value does it create, and for whom?",
    evidencePlaceholder:
      "e.g. Saves each clinic about 10 staff hours a month; practice managers already pay for scheduling software.",
    options: [
      { label: "It creates activity and interest, but no measurable value I can point to yet.", score: 0 },
      { label: "I believe there is value, but I have not quantified it or tested willingness to pay.", score: 1 },
      { label: "A buyer or sponsor can justify paying for, adopting or supporting it.", score: 2 },
    ],
    passSignal: "A buyer or sponsor can justify paying, adopting or supporting it.",
    refineSignal: "It creates activity, but not measurable value.",
    encouragement: "Value you can name is value you can price.",
    focus: {
      risk: "Without a value someone can justify, adoption stalls at the budget conversation.",
      move: "Quantify one saving or gain per customer, then test that number with a real buyer.",
      outcome: "A commercial case that survives contact with a decision maker.",
    },
  },
  {
    id: "market",
    number: 5,
    label: "First market",
    question: "Where should you focus first?",
    context:
      "Choose the first launch territory — a city, a region, a country or a defined online community. Start where you can test and win.",
    evidenceLabel: "Name your first launch area",
    evidencePlaceholder: "e.g. Calabar first, then the rest of Cross River once the workflow holds.",
    options: [
      { label: "I have not chosen — the plan is to launch as widely as possible.", score: 0 },
      { label: "I have a rough area in mind, but it is still wide or not decided.", score: 1 },
      { label: "The first launch area is small enough to understand, reach and validate.", score: 2 },
    ],
    passSignal: "The launch area is small enough to understand, reach and validate.",
    refineSignal: "The first market is too wide, too expensive or unfocused.",
    encouragement: "A small first market is the fastest route to real evidence.",
    focus: {
      risk: "A wide first market spreads effort thin and delays the evidence you need.",
      move: "Pick one area you can physically or practically reach, and commit to it for the first cycle.",
      outcome: "Faster learning, lower cost and a reference market to expand from.",
    },
  },
  {
    id: "reach",
    number: 6,
    label: "Reaching users",
    question: "Can you realistically reach the users?",
    context:
      "Decide the distribution path: direct visits, WhatsApp, referrals, social media, partnerships, ads, communities or institutions.",
    evidenceLabel: "How will the first 10–50 users hear about it?",
    evidencePlaceholder:
      "e.g. Direct visits to 20 clinics, then referrals through the state medical association.",
    options: [
      { label: "I do not yet have a believable path to the first users.", score: 0 },
      { label: "I have channel ideas, but none of them is tested.", score: 1 },
      { label: "I know specifically how the first 10–50 users or customers will be reached.", score: 2 },
    ],
    passSignal: "You know how the first 10–50 users or customers can be reached.",
    refineSignal: "Good product idea, but no believable path to users yet.",
    encouragement: "Distribution decided early saves a great product from silence.",
    focus: {
      risk: "A product with no route to its users never gets the feedback it needs to improve.",
      move: "Name one channel, one message and a list of the first 20 people you will approach.",
      outcome: "A repeatable way to put the product in front of the people it was built for.",
    },
  },
  {
    id: "feasibility",
    number: 7,
    label: "Clean build",
    question: "Can it be built cleanly?",
    context:
      "Check feasibility, technology fit, security, maintainability, cost, integrations, AI risks, data needs and support load.",
    evidenceLabel: "What has to be true technically?",
    evidencePlaceholder:
      "e.g. Needs offline-tolerant sync and patient data handled carefully; no exotic integrations required.",
    options: [
      { label: "It depends on things I am not sure are possible, affordable or safe yet.", score: 0 },
      { label: "It looks buildable, but scope, data or integrations are still open questions.", score: 1 },
      { label: "The first version can be built with controlled scope and professional standards.", score: 2 },
    ],
    passSignal: "The MVP can be built with controlled scope and professional engineering standards.",
    refineSignal: "It requires fragile shortcuts, unclear data, or engineering beyond current capacity.",
    encouragement: "Knowing the technical shape early is what keeps the build honest.",
    focus: {
      risk: "Unclear technical scope is where budgets, timelines and quality quietly fail.",
      move: "List the riskiest technical assumption and settle it with a small, time-boxed spike.",
      outcome: "A build plan with known constraints instead of discovered ones.",
    },
  },
  {
    id: "mvp",
    number: 8,
    label: "Simplest version",
    question: "What is the simplest version that proves the idea?",
    context:
      "Define the smallest serious product, service, demo, pilot or workflow that validates the core value.",
    evidenceLabel: "Describe the smallest version worth building",
    evidencePlaceholder:
      "e.g. One clinic, one shared booking screen, manual data import — no billing, no mobile app.",
    options: [
      { label: "The first version is still close to the full vision.", score: 0 },
      { label: "I have started cutting scope, but the first version is still doing a lot.", score: 1 },
      { label: "The first version proves the core value without building the dream version.", score: 2 },
    ],
    passSignal: "The MVP proves the main value without building the dream version first.",
    refineSignal: "The first version is bloated, expensive or full of nice-to-have features.",
    encouragement: "A small first version is not a smaller ambition — it is a faster one.",
    focus: {
      risk: "A bloated first version delays proof and spends budget on features nobody has asked for.",
      move: "Cut to the single workflow that proves the core value, and defer everything else by name.",
      outcome: "Real evidence sooner, at a fraction of the cost of the full build.",
    },
  },
  {
    id: "firstBuild",
    number: 9,
    label: "First build target",
    question: "What should be built first?",
    context:
      "Translate the strategy into the first technical slice: a user flow, a dashboard, a data model, an API, a prototype or an integration.",
    evidenceLabel: "Name the first thing to build",
    evidencePlaceholder:
      "e.g. The shared booking screen with create, move and cancel — nothing else.",
    options: [
      { label: "I have a list of things to build, but no first one chosen.", score: 0 },
      { label: "I know roughly where to start, but not precisely enough to hand over.", score: 1 },
      { label: "The first build target is clear enough for an engineering team to start on.", score: 2 },
    ],
    passSignal: "The first build target is clear enough for engineering execution.",
    refineSignal: "An engineering team would receive scattered ideas instead of a defined build request.",
    encouragement: "One defined first slice is worth more than ten described features.",
    focus: {
      risk: "Without a defined first slice, engineering time goes into coordination instead of progress.",
      move: "Choose one user flow, write what done looks like for it, and build only that.",
      outcome: "A build request a team can start on immediately and finish visibly.",
    },
  },
  {
    id: "advantage",
    number: 10,
    label: "Long-term advantage",
    question: "Does this create a meaningful long-term advantage?",
    context:
      "Check what compounds: trust, reusable systems, capability you keep, data you earn and future relevance.",
    evidenceLabel: "What do you still hold in two years?",
    evidencePlaceholder:
      "e.g. The scheduling data and clinic relationships make every later product easier to sell.",
    options: [
      { label: "It could work commercially, but it does not build towards anything lasting.", score: 0 },
      { label: "There is some lasting value, but I have not made it explicit.", score: 1 },
      { label: "It strengthens capability, trust and relevance well beyond the first launch.", score: 2 },
    ],
    passSignal: "The idea strengthens brand, capability, market trust and compounding advantage.",
    refineSignal: "It may be profitable, but it distracts from your identity or dilutes credibility.",
    encouragement: "That is the last gate — your result is ready.",
    focus: {
      risk: "Work that leaves nothing behind has to be re-earned with every new project.",
      move: "Name the capability, relationship or data asset this leaves you with after launch.",
      outcome: "Each cycle of work makes the next one cheaper and more credible.",
    },
  },
] as const;

/**
 * Mandatory kill switches from the framework: no evidence on any of these
 * sends the idea to Red regardless of the total score.
 */
export const IDEA_GATE_CRITICAL_IDS: readonly IdeaGateId[] = [
  "problem",
  "user",
  "commercial",
  "reach",
  "advantage",
];

export const IDEA_GATE_DECISIONS = {
  green: {
    label: "Green",
    headline: "Ready to move into execution",
    condition: "8–10 gates pass with evidence, and no critical gate is unanswered.",
    action: "Turn the plan into a build brief and start the first vertical slice.",
  },
  amber: {
    label: "Amber",
    headline: "Promising — sharpen the evidence first",
    condition: "5–7 gates pass, or the idea is promising but the evidence is still thin.",
    action:
      "Refine the problem, user, market, MVP and distribution before committing engineering time.",
  },
  red: {
    label: "Red",
    headline: "Worth reshaping before you build",
    condition:
      "Fewer than 5 gates pass, or a critical gate — problem, user, commercial value, reach or long-term advantage — has no evidence yet.",
    action:
      "Rework the weakest gates and run the assessment again. The idea is not closed; the evidence is not ready.",
  },
} as const;

export function ideaGateById(id: string) {
  return IDEA_GATE_QUESTIONS.find((gate) => gate.id === id);
}
