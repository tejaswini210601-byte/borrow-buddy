/** Small, consistent date formatting used across the app. */
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const monthYear = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

export const formatDayMonth = (iso: string) => dayMonth.format(new Date(iso));
export const formatMonthYear = (iso: string) => monthYear.format(new Date(iso));

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
