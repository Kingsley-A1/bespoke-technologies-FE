import { tool } from "ai";
import { z } from "zod";
import {
  BESPOKE_AI_APPROVED_PATHS,
  isBespokeAIApprovedPath,
} from "@/lib/ai/bespoke-ai-context";
import type {
  BespokeAIActionResult,
  BespokeAIProjectCard,
} from "@/lib/ai/bespoke-ai-types";
import {
  CONTACT_EMAIL,
  PHONE_DISPLAY,
  PROJECTS,
  SERVICES,
  TESTIMONIALS,
  WHATSAPP_INQUIRY_MESSAGE,
  WHATSAPP_NUMBER,
} from "@/lib/constants";

const projectTypeSchema = z.enum(["web", "mobile", "desktop", "web+mobile"]);

function projectToCard(
  project: (typeof PROJECTS)[number],
  reason?: string,
): BespokeAIProjectCard {
  return {
    id: project.id,
    name: project.name,
    category: project.category,
    description: project.description,
    year: project.year,
    tags: [...project.tags],
    type: project.type,
    path: "/projects",
    liveUrl: project.liveUrl,
    comingSoon: project.comingSoon,
    reason,
  };
}

function scoreProject(project: (typeof PROJECTS)[number], query: string) {
  const haystack = [
    project.name,
    project.type,
    project.category,
    project.description,
    ...project.tags,
  ]
    .join(" ")
    .toLowerCase();
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9+]+/i)
    .filter((term) => term.length > 2);

  return terms.reduce(
    (score, term) => score + (haystack.includes(term) ? 1 : 0),
    project.featured ? 1 : 0,
  );
}

function selectServicePath(need: string) {
  const query = need.toLowerCase();

  if (query.includes("mobile") || query.includes("app")) return "/services";
  if (query.includes("ai") || query.includes("automation")) return "/services";
  if (query.includes("saas") || query.includes("platform")) return "/services";
  if (query.includes("review") || query.includes("trust")) return "/reviews";

  return "/contact";
}

export const bespokeAITools = {
  openPage: tool({
    description: "Suggest an approved first-party Bespoke Technologies page.",
    inputSchema: z.object({
      path: z.enum(BESPOKE_AI_APPROVED_PATHS),
      label: z.string().min(2).max(80),
      reason: z.string().min(2).max(180),
    }),
    execute: async ({ path, label, reason }): Promise<BespokeAIActionResult> => {
      if (!isBespokeAIApprovedPath(path)) {
        return {
          type: "internal-link",
          path: "/contact",
          label: "Contact Bespoke Technologies",
          reason: "This is the safest next step for a custom request.",
        };
      }

      return { type: "internal-link", path, label, reason };
    },
  }),
  showContact: tool({
    description: "Show the fastest official Bespoke Technologies contact options.",
    inputSchema: z.object({}),
    execute: async (): Promise<BespokeAIActionResult> => ({
      type: "contact",
      phone: PHONE_DISPLAY,
      whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        WHATSAPP_INQUIRY_MESSAGE,
      )}`,
      email: CONTACT_EMAIL,
      contactPath: "/contact",
      message: "Use WhatsApp for the fastest project conversation.",
    }),
  }),
  listProjects: tool({
    description:
      "List real Bespoke Technologies projects, optionally filtered by type or featured status.",
    inputSchema: z.object({
      featuredOnly: z.boolean().optional(),
      type: projectTypeSchema.optional(),
      limit: z.number().int().min(1).max(6).optional(),
    }),
    execute: async ({
      featuredOnly = false,
      type,
      limit = 4,
    }): Promise<BespokeAIActionResult> => {
      const projects = PROJECTS.filter((project) => {
        if (featuredOnly && !project.featured) return false;
        if (type && project.type !== type) return false;
        return true;
      })
        .slice(0, limit)
        .map((project) => projectToCard(project));

      return {
        type: "project-list",
        label: featuredOnly ? "Featured projects" : "Relevant projects",
        projects,
      };
    },
  }),
  recommendProjects: tool({
    description:
      "Recommend 2-4 real Bespoke Technologies projects based on the user's need.",
    inputSchema: z.object({
      need: z.string().min(2).max(400),
      businessType: z.string().min(2).max(120).optional(),
    }),
    execute: async ({ need, businessType }): Promise<BespokeAIActionResult> => {
      const query = `${need} ${businessType ?? ""}`;
      const projects = [...PROJECTS]
        .sort((a, b) => scoreProject(b, query) - scoreProject(a, query))
        .slice(0, 4)
        .map((project) =>
          projectToCard(
            project,
            `Relevant to "${need}" because it shows ${project.category.toLowerCase()} work with ${project.tags
              .slice(0, 2)
              .join(" and ")}.`,
          ),
        );

      return {
        type: "project-recommendations",
        need,
        suggestedServicePath: selectServicePath(need),
        projects,
      };
    },
  }),
  openReviews: tool({
    description: "Show review summaries and a link to the Bespoke reviews page.",
    inputSchema: z.object({}),
    execute: async (): Promise<BespokeAIActionResult> => ({
      type: "reviews",
      path: "/reviews",
      label: "Read client reviews",
      testimonials: TESTIMONIALS.slice(0, 3).map((item) => ({
        quote: item.quote,
        author: item.author,
        role: item.role,
        company: item.company,
      })),
    }),
  }),
  explainServices: tool({
    description:
      "Map a user's business need to relevant Bespoke Technologies services.",
    inputSchema: z.object({
      need: z.string().min(2).max(400),
    }),
    execute: async ({ need }): Promise<BespokeAIActionResult> => {
      const ranked = [...SERVICES]
        .sort((a, b) => {
          const aScore = scoreText(`${a.title} ${a.tagline} ${a.description}`, need);
          const bScore = scoreText(`${b.title} ${b.tagline} ${b.description}`, need);
          return bScore - aScore;
        })
        .slice(0, 3)
        .map((service) => ({
          id: service.id,
          title: service.title,
          tagline: service.tagline,
          description: service.description,
          path: "/services",
        }));

      return {
        type: "services",
        need,
        services: ranked,
        recommendedAction: {
          label: "Start a project conversation",
          path: "/contact",
        },
      };
    },
  }),
};

function scoreText(text: string, query: string) {
  const haystack = text.toLowerCase();
  return query
    .toLowerCase()
    .split(/[^a-z0-9+]+/i)
    .filter((term) => term.length > 2)
    .reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}
