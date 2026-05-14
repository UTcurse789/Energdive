function parseEventSortDate(value) {
    if (!value) return null;
    const normalized = value.trim().replace(/(\d{1,2})(st|nd|rd|th)/gi, '$1').replace(/\s+/g, ' ');
    if (!normalized) return null;
    const nativeDate = new Date(normalized);
    if (!Number.isNaN(nativeDate.getTime())) return nativeDate;
    const lowered = normalized.toLowerCase();
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = months.findIndex((month) => lowered.includes(month));
    if (monthIndex === -1) return null;
    const yearMatch = lowered.match(/\b(20\d{2})\b/);
    const dayMatch = lowered.match(/\b(\d{1,2})\b/);
    const year = yearMatch ? Number(yearMatch[1]) : 2026;
    const day = dayMatch ? Number(dayMatch[1]) : 1;
    const candidate = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));
    return Number.isNaN(candidate.getTime()) ? null : candidate;
}

const dates = [
  'July 8 - 10, 2026',
  '14–17 September 2026',
  'Dec 2026',
  '1st –3rd September 2026',
  '06th - 07th October 2026',
  '01st - 03rd September 2026',
  ' 06th - 07th August 2026',
  '18th - 19th June 2026',
  '14th - 15th May 2026',
  '26 February 2026'
];

dates.forEach(d => console.log(d, '=>', parseEventSortDate(d)));
