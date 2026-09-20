import { getPublishedCollection } from 'astro-course-university/content';
import { withBase } from 'astro-theme-university/url';

/**
 * The two codewalks: ten minutes each, in the week after the work is handed in.
 *
 * Dates are never typed here. Each codewalk sits two days after the session of
 * the week its assessment names, so the schedule follows src/course-config.ts
 * through the sessions collection, and a moved teaching week moves the
 * codewalk with it. spec/codewalks.test.ts holds that agreement.
 *
 * The room grid lives here too, because the page, the capacity it states and
 * the check all have to mean the same thing: five blocks of five appointments,
 * fifteen minutes apart, in two rooms at once.
 */
export interface Codewalk {
  id: string;
  /** The assessment examined, as its content id. */
  assessment: string;
  title: string;
  /** The teaching week the assessment names for its in-person part. */
  week: number;
  date: Date;
  href: string;
  assessmentHref: string;
  /** One line on what the ten minutes are for; the assessment page has the rest. */
  purpose: string;
}

export * from './codewalk-grid';

const PLANNED = [
  {
    id: 'codewalk-a1',
    assessment: 'a1-reproduce-the-number',
    title: 'Codewalk: reproduce the number',
    week: 6,
    purpose:
      'One difference between your number and the published one, defended out loud.',
  },
  {
    id: 'codewalk-a2',
    assessment: 'a2-break-the-number',
    title: 'Codewalk: break the number',
    week: 10,
    purpose:
      'Your archive is run from its seed on our machine, and the score has to come back.',
  },
];

/** Two days after that week's session: the Monday teaches, the Wednesday examines. */
function twoDaysAfter(session: Date): Date {
  const date = new Date(session);
  date.setUTCDate(date.getUTCDate() + 2);
  return date;
}

export async function getCodewalks(): Promise<Codewalk[]> {
  const sessions = await getPublishedCollection('sessions');
  return PLANNED.map((planned) => {
    const session = sessions.find((s) => s.data.week === planned.week);
    if (!session) throw new Error(`No session for codewalk week ${planned.week}`);
    return {
      ...planned,
      date: twoDaysAfter(session.data.date),
      href: withBase(`/sessions/${planned.id}/`),
      assessmentHref: withBase(`/assessments/${planned.assessment}/`),
    };
  });
}

/** The codewalk that lands in a given teaching week, for the week listing. */
export async function getCodewalkByWeek(): Promise<Map<number, Codewalk>> {
  return new Map((await getCodewalks()).map((walk) => [walk.week, walk]));
}
