// Minimal ISO-8601 week helpers — no dependency needed for this.

export function toISOWeekString(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const weekNum = 1 + Math.round((d - firstThursday) / (7 * 864e5));
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function currentISOWeek() {
  return toISOWeekString(new Date());
}

export function weekStart(isoWeekString) {
  const [yearStr, weekStr] = isoWeekString.split("-W");
  const year = Number(yearStr);
  const week = Number(weekStr);
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const start = new Date(simple);
  if (dow <= 4) start.setUTCDate(simple.getUTCDate() - dow + 1);
  else start.setUTCDate(simple.getUTCDate() + 8 - dow);
  return start;
}

export function weekEnd(isoWeekString) {
  const s = weekStart(isoWeekString);
  const e = new Date(s);
  e.setUTCDate(s.getUTCDate() + 6);
  return e;
}

export function shiftWeek(isoWeekString, delta) {
  const s = weekStart(isoWeekString);
  s.setUTCDate(s.getUTCDate() + delta * 7);
  return toISOWeekString(s);
}

// All ISO weeks from startDate through endDate (inclusive), capped at 2 years
// as a sanity guard against bad input.
export function weeksBetween(startDate, endDate) {
  let cur = toISOWeekString(new Date(startDate));
  const endWeek = toISOWeekString(new Date(endDate));
  const weeks = [];
  let guard = 0;
  while (guard++ < 104) {
    weeks.push(cur);
    if (cur === endWeek) break;
    cur = shiftWeek(cur, 1);
  }
  return weeks;
}

export function weekRangeLabel(isoWeekString) {
  const s = weekStart(isoWeekString);
  const e = weekEnd(isoWeekString);
  const fmt = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(s)} – ${fmt(e)}`;
}

// Does a leave record's [startDate, endDate] (YYYY-MM-DD strings) overlap this ISO week?
export function weekOverlapsRange(isoWeekString, startDate, endDate) {
  const s = weekStart(isoWeekString).toISOString().slice(0, 10);
  const e = weekEnd(isoWeekString).toISOString().slice(0, 10);
  return startDate <= e && endDate >= s;
}
