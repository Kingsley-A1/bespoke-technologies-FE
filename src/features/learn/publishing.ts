import { parseContentBlock } from "./content/schemas";

type PublishingBlock = { id: string; type: string; order: number; required: boolean; completionRule: string; config: unknown };
type PublishingLesson = { id: string; title: string; slug: string; objective: string; sortOrder: number; blocks: PublishingBlock[] };
type PublishingModule = { id: string; title: string; sortOrder: number; lessons: PublishingLesson[] };

export type PublishingCourse = {
  id: string;
  versionNumber: number;
  state: string;
  title: string;
  summary: string;
  description: string;
  reviewedAt?: string;
  authorIds: string[];
  modules: PublishingModule[];
};

function ordered(items: Array<{ sortOrder?: number; order?: number }>) {
  const values = items.map((item) => item.sortOrder ?? item.order ?? -1);
  return new Set(values).size === values.length && values.every((value, index) => value === index);
}

export function validateCourseForPublishing(course: PublishingCourse) {
  const errors: string[] = [];
  if (!course.title.trim()) errors.push("A course title is required.");
  if (!course.summary.trim()) errors.push("A course summary is required.");
  if (!course.description.trim()) errors.push("A course description is required.");
  if (!course.reviewedAt || Number.isNaN(new Date(course.reviewedAt).getTime())) errors.push("A valid review date is required.");
  if (course.authorIds.length === 0) errors.push("At least one author is required.");
  if (course.modules.length === 0) errors.push("At least one module is required.");
  if (course.modules.length > 0 && !ordered(course.modules)) errors.push("Modules must have a contiguous unique order.");

  for (const courseModule of course.modules) {
    if (!courseModule.title.trim()) errors.push(`Module ${courseModule.id} needs a title.`);
    if (courseModule.lessons.length === 0) errors.push(`Module ${courseModule.id} needs at least one lesson.`);
    if (courseModule.lessons.length > 0 && !ordered(courseModule.lessons)) errors.push(`Lessons in module ${courseModule.id} must have a contiguous unique order.`);
    for (const lesson of courseModule.lessons) {
      if (!lesson.title.trim() || !lesson.slug.trim() || !lesson.objective.trim()) errors.push(`Lesson ${lesson.id} needs a title, slug, and objective.`);
      if (lesson.blocks.length === 0) errors.push(`Lesson ${lesson.id} needs at least one content block.`);
      if (lesson.blocks.length > 0 && !ordered(lesson.blocks)) errors.push(`Blocks in lesson ${lesson.id} must have a contiguous unique order.`);
      for (const block of lesson.blocks) {
        try {
          parseContentBlock({ id: block.id, type: block.type, order: block.order, required: block.required, completionRule: block.completionRule, config: block.config });
        } catch {
          errors.push(`Block ${block.id} does not meet its content or accessibility requirements.`);
        }
      }
    }
  }
  return errors;
}
