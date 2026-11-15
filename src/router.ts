import { useEffect, useState } from 'react'

/**
 * Hash routing (`#/plan`, `#/exercise/gym-pull-up`): it needs no server rewrite rules,
 * so deep links work on any static host, GitHub Pages included.
 */
const read = () =>
  window.location.hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => decodeURIComponent(part))

export function useRoute(): string[] {
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export const href = (...parts: string[]): string => `#/${parts.map(encodeURIComponent).join('/')}`

export const navigate = (...parts: string[]): void => {
  window.location.hash = href(...parts)
}
