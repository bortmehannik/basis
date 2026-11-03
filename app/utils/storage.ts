interface StorageReadResult {
  ok: boolean
  value: string | null
}

export const readLocalStorage = (key: string): StorageReadResult => {
  if (typeof localStorage === 'undefined') return { ok: false, value: null }

  try {
    return { ok: true, value: localStorage.getItem(key) }
  }
  catch {
    return { ok: false, value: null }
  }
}

export const writeLocalStorage = (key: string, value: string): boolean => {
  if (typeof localStorage === 'undefined') return false

  try {
    localStorage.setItem(key, value)
    return true
  }
  catch {
    return false
  }
}
