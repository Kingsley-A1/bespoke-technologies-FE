export function createPublicCourseService<T>({
  listPublishedCourses,
}: {
  listPublishedCourses: (search?: string) => Promise<readonly T[]>;
}) {
  return {
    list(search?: string) {
      return listPublishedCourses(search);
    },
  };
}
