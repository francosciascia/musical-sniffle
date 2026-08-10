import { useCallback } from 'react'

function isEditableSelect(el) {
  return (
    el.getAttribute?.('role') === 'combobox' ||
    el.getAttribute?.('aria-haspopup') === 'listbox' ||
    el.tagName === 'SELECT'
  )
}

function isOpenListbox() {
  return !!document.querySelector('[role="listbox"]')
}

/**
 * Navegación rápida en formularios: ↓ siguiente campo, ↑ anterior.
 * No interfiere si hay un menú/select abierto.
 */
export function useFormArrowNav() {
  return useCallback((event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    if (event.altKey || event.ctrlKey || event.metaKey) return

    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.tagName === 'TEXTAREA') return
    if (isOpenListbox()) return
    // En selects nativos / combobox abiertos las flechas cambian la opción
    if (isEditableSelect(target) && event.key === 'ArrowDown') {
      // Si el select está cerrado, preferimos saltar al siguiente campo
      if (target.getAttribute('aria-expanded') === 'true') return
    }

    const root = event.currentTarget
    if (!(root instanceof HTMLElement)) return

    const focusables = [
      ...root.querySelectorAll(
        'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((el) => {
      if (!(el instanceof HTMLElement)) return false
      if (el.getAttribute('aria-hidden') === 'true') return false
      // MUI pone inputs hidden en selects; nos quedamos con los visibles
      const style = window.getComputedStyle(el)
      if (style.visibility === 'hidden' || style.display === 'none') return false
      if (el.offsetParent === null && style.position !== 'fixed') return false
      return true
    })

    // Deduplicar wrappers MUI (a veces hay input + div tabindex)
    const unique = []
    const seen = new Set()
    for (const el of focusables) {
      const key = el.id || el.name || el
      if (seen.has(key) && typeof key === 'string' && key) continue
      // Preferir el input real dentro del mismo TextField
      if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && el.tagName !== 'SELECT') {
        continue
      }
      seen.add(key)
      unique.push(el)
    }

    const idx = unique.indexOf(target)
    if (idx < 0) return

    const nextIdx = event.key === 'ArrowDown' ? idx + 1 : idx - 1
    if (nextIdx < 0 || nextIdx >= unique.length) return

    event.preventDefault()
    unique[nextIdx].focus()
    if (typeof unique[nextIdx].select === 'function' && unique[nextIdx].type !== 'date') {
      try {
        unique[nextIdx].select()
      } catch {
        /* ignore */
      }
    }
  }, [])
}
