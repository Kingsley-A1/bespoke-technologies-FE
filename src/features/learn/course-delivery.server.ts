import "server-only";

import { adminQuery, isAdminDatabaseConfigured } from "@/features/admin/db";
import { createCourseDeliveryRepository } from "./course-delivery";
import { createCourseDeliveryService } from "./course-delivery-service";
import { resolveCourseAccess } from "./entitlements";
import { createLearnerProgressReader } from "./learner-progress-read";
import { createLearnerDashboardReader } from "./learner-dashboard-data";
import { createLearnRepository } from "./repository";

const deliveryRepository = createCourseDeliveryRepository({ query: adminQuery });
const accessRepository = createLearnRepository({ query: adminQuery });
const progressReader = createLearnerProgressReader({ query: adminQuery });
const dashboardReader = createLearnerDashboardReader({ query: adminQuery });
const deliveryService = createCourseDeliveryService({
  getCourse: deliveryRepository.findPublishedCourseBySlug,
  resolveAccess: ({ courseId, learnerId }) => resolveCourseAccess({ courseId, learnerId, now: new Date() }, accessRepository),
});

export async function loadPublishedCourseForRequest(input: { slug: string; learnerId?: string }) {
  if (!isAdminDatabaseConfigured()) return null;
  return deliveryService.loadCourse(input);
}

export async function loadPublishedLessonForRequest(input: { courseSlug: string; lessonSlug: string }) {
  if (!isAdminDatabaseConfigured()) return null;
  return deliveryRepository.findPublishedLesson(input);
}

export async function loadLearnerLessonStates(input: { learnerId: string; versionId: string }) {
  if (!isAdminDatabaseConfigured()) return [];
  return progressReader.listLessonStates(input);
}

export async function loadLearnerDashboardCourses(learnerId: string) {
  if (!isAdminDatabaseConfigured()) return [];
  return dashboardReader.listForLearner(learnerId);
}

export async function loadLearnerBlockPositions(input: { learnerId: string; versionId: string; lessonId: string }) {
  if (!isAdminDatabaseConfigured()) return [];
  return progressReader.listBlockPositions(input);
}
