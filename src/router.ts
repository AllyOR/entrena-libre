import { useEffect, useRef, useState } from 'react'

/**
 * Hash routing (`#/plan`, `#/exercise/gym-pull-up`): it needs no server rewrite rules,
 * so deep links work on any static host, GitHub Pages included.
 *
 * Going back restores the page as it was left: a filter lives in the URL
 * (`#/exercises/gym/calves`), and the scroll position of each history entry is
 * remembered here. A new page starts at the top.
 */
const read = () =>
  window.location.hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => decodeURIComponent(part))

const REPLACED = 'route:replaced'

/** The number this module gave the current history entry, if it has one. */
const entryIndex = (): number | undefined => {
  const state = window.history.state as { i?: unknown } | null
  return typeof state?.i === 'number' ? state.i : undefined
}

/** Scroll position of each visited history entry, by its number. Lost on a full reload, which starts at the top anyway. */
const scrolls = new Map<number, number>()
let current = 0
let highest = 0

export function useRoute(): string[] {
  const [route, setRoute] = useState(read)
  /** Where to scroll once the new route has rendered. */
  const pendingScroll = useRef<number | null>(null)

  useEffect(() => {
    // The browser's own restoration runs before the page for the entry has rendered.
    window.history.scrollRestoration = 'manual'
    current = highest = entryIndex() ?? 0
    window.history.replaceState({ i: current }, '')

    const onChange = () => {
      scrolls.set(current, window.scrollY)
      const visited = entryIndex()
      if (visited === undefined) {
        // A link or `navigate`: a new entry, numbered after every existing one.
        current = highest += 1
        window.history.replaceState({ i: current }, '')
        pendingScroll.current = 0
      } else {
        // Back or forward to an entry seen before.
        current = visited
        pendingScroll.current = scrolls.get(visited) ?? 0
      }
      setRoute(read())
    }
    const onReplaced = () => setRoute(read())

    window.addEventListener('hashchange', onChange)
    window.addEventListener(REPLACED, onReplaced)
    return () => {
      window.removeEventListener('hashchange', onChange)
      window.removeEventListener(REPLACED, onReplaced)
    }
  }, [])

  useEffect(() => {
    if (pendingScroll.current === null) return
    window.scrollTo(0, pendingScroll.current)
    pendingScroll.current = null
  }, [route])

  return route
}

export const href = (...parts: string[]): string => `#/${parts.map(encodeURIComponent).join('/')}`

/** Goes to a page, adding a history entry. */
export const navigate = (...parts: string[]): void => {
  window.location.hash = href(...parts)
}

/**
 * Changes the URL of the current page in place: no new history entry and no scroll.
 * For state that belongs to the page, such as a filter, so that Back returns to it.
 */
export const replaceRoute = (...parts: string[]): void => {
  window.history.replaceState(window.history.state, '', href(...parts))
  window.dispatchEvent(new Event(REPLACED))
}
