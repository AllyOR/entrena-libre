import { Icon, type IconName } from './components/Icon'
import type { MessageKey } from './i18n/es'
import { useI18n } from './i18n/useI18n'
import { ExerciseDetail } from './pages/ExerciseDetail'
import { Home } from './pages/Home'
import { Library } from './pages/Library'
import { Nutrition } from './pages/Nutrition'
import { PlanPage } from './pages/PlanPage'
import { ProfilePage } from './pages/ProfilePage'
import { Progress } from './pages/Progress'
import { Workout } from './pages/Workout'
import { href, useRoute } from './router'
import { useStore } from './state/store'
import type { Lang } from './types'

const NAV: { path: string; label: MessageKey; icon: IconName; also?: string[] }[] = [
  { path: '', label: 'navHome', icon: 'home' },
  { path: 'exercises', label: 'navExercises', icon: 'dumbbell', also: ['exercise'] },
  { path: 'plan', label: 'navPlan', icon: 'calendar', also: ['workout'] },
  { path: 'nutrition', label: 'navNutrition', icon: 'leaf' },
  { path: 'progress', label: 'navProgress', icon: 'chart' },
]

const LANGS: Lang[] = ['es', 'en']

function Page({ route }: { route: string[] }) {
  const [page, a, b] = route
  switch (page) {
    case undefined:
      return <Home />
    case 'exercises':
      return <Library section={a} />
    case 'exercise':
      return <ExerciseDetail id={a} />
    case 'plan':
      return <PlanPage />
    case 'workout':
      // Remount per session so the player starts from the first exercise.
      return <Workout key={`${a}/${b}`} month={a} sessionId={b} />
    case 'nutrition':
      return <Nutrition />
    case 'progress':
      return <Progress />
    case 'profile':
      return <ProfilePage />
    default:
      return <Home />
  }
}

export function App() {
  const { t } = useI18n()
  const { state, setLang, toggleTheme } = useStore()
  const route = useRoute()
  const page = route[0] ?? ''
  const dark = state.theme === 'dark'

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>

      <header className="topbar">
        <a className="brand" href={href()}>
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <rect width="32" height="32" rx="8" className="brand-bg" />
            <path d="M6 16h20M9 11v10M23 11v10M5 13.5v5M27 13.5v5" className="brand-mark" />
          </svg>
          <span>{t('appName')}</span>
        </a>
        <div className="topbar-actions">
          <div className="lang-switch" role="group" aria-label={t('language')}>
            {LANGS.map((code) => (
              <button key={code} type="button" lang={code} aria-pressed={state.lang === code} onClick={() => setLang(code)}>
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="theme-switch"
            role="switch"
            aria-checked={dark}
            aria-label={t(dark ? 'themeToLight' : 'themeToDark')}
            title={t(dark ? 'themeToLight' : 'themeToDark')}
            onClick={toggleTheme}
          >
            <span className="theme-thumb">
              <Icon name={dark ? 'moon' : 'sun'} size={14} />
            </span>
          </button>
          <a className="icon-btn" href={href('profile')} aria-label={t('navProfile')} aria-current={page === 'profile' ? 'page' : undefined}>
            <Icon name="user" />
          </a>
        </div>
      </header>

      <nav className="nav" aria-label={t('appName')}>
        {NAV.map((item) => {
          const active = page === item.path || item.also?.includes(page)
          return (
            <a key={item.path} href={item.path ? href(item.path) : href()} aria-current={active ? 'page' : undefined}>
              <Icon name={item.icon} size={22} />
              <span>{t(item.label)}</span>
            </a>
          )
        })}
      </nav>

      <main id="main" tabIndex={-1}>
        <Page route={route} />
      </main>
    </div>
  )
}
