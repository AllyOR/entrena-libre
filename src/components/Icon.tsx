const PATHS = {
  home: 'M4 11.5 12 4l8 7.5M6 10v9h4v-5h4v5h4v-9',
  dumbbell: 'M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12',
  calendar: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM4 10h16M8 3v4M16 3v4',
  leaf: 'M5 19c0-9 5-14 15-14 0 10-5 15-14 15M5 19c2-5 5-8 9-10',
  chart: 'M4 20h16M7 20v-6M12 20V6M17 20v-9',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  chevronLeft: 'M15 5l-7 7 7 7',
  chevronRight: 'M9 5l7 7-7 7',
  alert: 'M12 4 2.5 20h19L12 4ZM12 10v5M12 17.5v.5',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v6M12 7.5v.5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  refresh: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5',
} as const

export type IconName = keyof typeof PATHS

/** A 24px stroke icon. Decorative: the control that holds it carries the label. */
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
