/**
 * True while reloading the page would cost the person something: a workout in
 * progress keeps its place (exercise, set, timer) only in memory.
 */
export const isBusy = (hash: string): boolean => /^#\/workout\/./.test(hash)
