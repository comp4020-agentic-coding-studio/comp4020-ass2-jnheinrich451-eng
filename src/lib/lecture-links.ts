import { getPublishedCollection } from 'astro-course-university/content';
import { withBase } from 'astro-theme-university/url';

/** The catalogue and in-session sequence share the published lecture programme. */
export async function getLectureLinks() {
  const lectures = await getPublishedCollection('lectures');
  return new Map(lectures.map(lecture => {
    const week = lecture.data.week;
    // Retain the established Week 2 slide title in navigation.
    const title = week === 2 ? 'Two Gaussians, One Number' : lecture.data.title;
    return [week, {
      href: withBase(`/lectures/${lecture.id}/`),
      label: `Lecture ${String(week).padStart(2, '0')} · ${title}`,
    }];
  }));
}
