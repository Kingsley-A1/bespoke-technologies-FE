import type { UIMessage } from "ai";

export type BespokeAIActionType =
  | "internal-link"
  | "contact"
  | "project-list"
  | "project-recommendations"
  | "reviews"
  | "services";

export type BespokeAIProjectCard = {
  id: string;
  name: string;
  category: string;
  description: string;
  year: string;
  tags: string[];
  type: string;
  path: string;
  liveUrl?: string;
  comingSoon?: boolean;
  reason?: string;
};

export type BespokeAIActionResult =
  | {
      type: "internal-link";
      path: string;
      label: string;
      reason: string;
    }
  | {
      type: "contact";
      phone: string;
      whatsappUrl: string;
      email: string;
      contactPath: string;
      message: string;
    }
  | {
      type: "project-list";
      label: string;
      projects: BespokeAIProjectCard[];
    }
  | {
      type: "project-recommendations";
      need: string;
      suggestedServicePath: string;
      projects: BespokeAIProjectCard[];
    }
  | {
      type: "reviews";
      path: string;
      label: string;
      testimonials: Array<{
        quote: string;
        author: string;
        role: string;
        company: string;
      }>;
    }
  | {
      type: "services";
      need: string;
      services: Array<{
        id: string;
        title: string;
        tagline: string;
        description: string;
        path: string;
      }>;
      recommendedAction: {
        label: string;
        path: string;
      };
    };

export type BespokeAIUIMessage = UIMessage<
  never,
  never,
  {
    openPage: {
      input: {
        path: string;
        label: string;
        reason: string;
      };
      output: Extract<BespokeAIActionResult, { type: "internal-link" }>;
    };
    showContact: {
      input: Record<string, never>;
      output: Extract<BespokeAIActionResult, { type: "contact" }>;
    };
    listProjects: {
      input: {
        featuredOnly?: boolean;
        type?: "web" | "mobile" | "desktop" | "web+mobile";
        limit?: number;
      };
      output: Extract<BespokeAIActionResult, { type: "project-list" }>;
    };
    recommendProjects: {
      input: {
        need: string;
        businessType?: string;
      };
      output: Extract<BespokeAIActionResult, { type: "project-recommendations" }>;
    };
    openReviews: {
      input: Record<string, never>;
      output: Extract<BespokeAIActionResult, { type: "reviews" }>;
    };
    explainServices: {
      input: {
        need: string;
      };
      output: Extract<BespokeAIActionResult, { type: "services" }>;
    };
  }
>;
