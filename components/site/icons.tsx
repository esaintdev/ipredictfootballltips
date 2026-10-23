import type { SVGProps } from "react";

// Inline stroke icons (24×24, currentColor) for the public site.
const PATHS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></>,
  list: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3h6v3H9zM9 11h6M9 15h6" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.5 2.5L16 9.5" /></>,
  trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v1.5A3.5 3.5 0 0 1 16.5 10M7 5H4v1.5A3.5 3.5 0 0 0 7.5 10" /></>,
  chart: <><path d="M3 20h18" /><rect x="5" y="11" width="3" height="7" rx="1" /><rect x="10.5" y="6" width="3" height="12" rx="1" /><rect x="16" y="13" width="3" height="5" rx="1" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  calendarNext: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M10 14h5m-2-2 2 2-2 2" /></>,
  weekend: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><rect x="12" y="13" width="5" height="4" rx=".5" fill="currentColor" /></>,
  ball: <><circle cx="12" cy="12" r="9.5" /><path d="m12 7.6 3.2 2.3-1.2 3.8h-4L8.8 9.9z" /><path d="M12 7.6V2.5M15.2 9.9l4.6-1.5M14 13.7l2.9 4M10 13.7l-2.9 4M8.8 9.9 4.2 8.4" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  flame: <path d="M12 21c-4 0-7-2.7-7-6.5 0-3.3 2.4-5.4 3.5-8 .9 1.6 1.6 2.6 3 3.2C11.5 6.6 13 4.3 15 3c.4 3.2 4 5.6 4 11 0 4-3 7-7 7z" />,
  shield: <><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  trend: <><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17v.5" /></>,
  xCircle: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, className = "", ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden className={`shrink-0 ${className}`} {...rest}>
      {PATHS[name]}
    </svg>
  );
}

/** Brand mark: a ball inside a rising-chart shield. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2ee6a6" /><stop offset="1" stopColor="#0a9a68" /></linearGradient>
      </defs>
      <path d="M20 2 35 7.5v11.3C35 28.6 28.6 35.6 20 38 11.4 35.6 5 28.6 5 18.8V7.5z" fill="url(#lm-g)" />
      <circle cx="20" cy="19" r="8.5" fill="#0a1120" />
      <path d="m20 14.6 3 2.2-1.1 3.5h-3.8L17 16.8z" fill="#fff" />
      <path d="M20 14.6v-4.1M23 16.8l3.9-1.3M21.9 20.3l2.4 3.4M18.1 20.3l-2.4 3.4M17 16.8l-3.9-1.3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M27.5 7.5h4v4" stroke="#f7c948" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
