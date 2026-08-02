import type { PublishedCourseDetail } from "./course-delivery";
import type { AccessDecision } from "./entitlements";

export function createCourseDeliveryService({
  getCourse,
  resolveAccess,
}: {
  getCourse: (slug: string) => Promise<PublishedCourseDetail | null>;
  resolveAccess: (input: { courseId: string; learnerId?: string }) => Promise<AccessDecision>;
}) {
  return {
    async loadCourse(input: { slug: string; learnerId?: string }) {
      const course = await getCourse(input.slug);
      if (!course) return null;
      const access = await resolveAccess({ courseId: course.id, learnerId: input.learnerId });
      return { course, access };
    },
  };
}
