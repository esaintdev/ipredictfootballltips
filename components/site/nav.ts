import { CATEGORIES, categoryHref } from "@/lib/tips";

export const TIP_LINKS = CATEGORIES.map((c) => ({ href: categoryHref(c), label: c.label }));

export const DAY_LINKS = [
  { href: "/predictions-for-today", label: "Football Predictions for Today" },
  { href: "/predictions-for-tomorrow", label: "Football Predictions for Tomorrow" },
  { href: "/predictions-for-the-weekend", label: "Football Predictions for the Weekend" },
];

export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export const WEEKDAY_LINKS = WEEKDAYS.map((d) => ({ href: `/${d}-predictions`, label: `${d[0].toUpperCase()}${d.slice(1)} Football Predictions` }));

export const MAIN_NAV = [
  { href: "/", label: "Home", icon: "⚽" },
  { href: "/banker-of-the-day", label: "BOTD", icon: "🎯" },
  { href: "/results", label: "Results", icon: "✅" },
  { href: "/leagues", label: "Leagues", icon: "🏆" },
  { href: "/accuracy", label: "Accuracy", icon: "📊" },
];
