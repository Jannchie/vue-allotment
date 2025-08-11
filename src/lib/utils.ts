import { clamp } from 'es-toolkit'
import { setGlobalSashSize } from './sash'

/**
 * Set sash size. This is set in both css and js and this function keeps the two in sync.
 *
 * @param sashSize Sash size in pixels
 */
export function setSashSize(sashSize: number) {
  const size = clamp(sashSize, 4, 20)
  const hoverSize = clamp(sashSize, 1, 8)

  document.documentElement.style.setProperty('--sash-size', `${size}px`)
  document.documentElement.style.setProperty(
    '--sash-hover-size',
    `${hoverSize}px`,
  )

  setGlobalSashSize(size)
}
