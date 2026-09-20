// The codewalk day, as data, with no Astro imports: the page prints this grid,
// the capacity is computed from it, and spec/codewalks.test.ts reads the same
// file, so the stated number of appointments cannot drift from the table.

export const ROOMS = ['2.14', '2.16'] as const;
export const BUILDING = 'Continuous Improvement Building';
/** Each block runs five appointments, one every fifteen minutes, in each room. */
export const BLOCKS = [
  { start: '09:00', end: '10:15' },
  { start: '10:30', end: '11:45' },
  { start: '13:00', end: '14:15' },
  { start: '14:30', end: '15:45' },
  { start: '15:45', end: '17:00' },
] as const;
export const SLOTS_PER_BLOCK = 5;
export const MINUTES_APART = 15;
export const CAPACITY = BLOCKS.length * SLOTS_PER_BLOCK * ROOMS.length;
