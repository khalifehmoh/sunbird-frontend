import { useEffect, useRef } from 'react'

/**
 * Calls `onNew` with the rows that appear after the first load of a polled
 * list. `resetKey` should change with the filters, so switching a filter does
 * not announce every row of the new view as "new".
 */
export function useNewItemAlerts<T extends { id: string }>(
  items: T[] | undefined,
  resetKey: string,
  onNew: (fresh: T[]) => void,
) {
  const seen = useRef<Set<string> | null>(null)
  const key = useRef(resetKey)
  const callback = useRef(onNew)

  useEffect(() => {
    callback.current = onNew
  })

  useEffect(() => {
    if (!items) return
    if (key.current !== resetKey) {
      key.current = resetKey
      seen.current = null
    }
    if (seen.current === null) {
      seen.current = new Set(items.map((item) => item.id))
      return
    }
    const known = seen.current
    const fresh = items.filter((item) => !known.has(item.id))
    for (const item of fresh) known.add(item.id)
    if (fresh.length > 0) callback.current(fresh)
  }, [items, resetKey])
}
