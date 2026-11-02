/** Animates a number from its previous value to the new one (used for live targets). */
import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, durationMs = 600) {
  const [value, setValue] = useState(target)
  const from = useRef(target)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setValue(target)
      from.current = target
      return
    }
    const start = performance.now()
    const startValue = from.current
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(startValue + (target - startValue) * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
      else from.current = target
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return value
}
