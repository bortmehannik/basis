import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STORAGE_SCHEMA_VERSION, type NoteDraft, type PersistedDrafts } from '~/types/note'
import { cloneNote } from '~/utils/note'
import { normalizeNote } from '~/stores/notes'
import { readLocalStorage, writeLocalStorage } from '~/utils/storage'

export const DRAFTS_STORAGE_KEY = 'notes-app:drafts'
export const parseDrafts = (raw: string | null): Record<string, NoteDraft> => {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as { version?: unknown; drafts?: unknown }
    if ((parsed.version !== 1 && parsed.version !== STORAGE_SCHEMA_VERSION)
      || !parsed.drafts
      || typeof parsed.drafts !== 'object') return {}

    return Object.fromEntries(Object.entries(parsed.drafts).flatMap(([key, value]) => {
      const draft = value as Partial<NoteDraft> | null
      const note = normalizeNote(draft?.note)
      const sourceId = draft?.sourceId
      if (!draft
        || !note
        || (sourceId !== null && typeof sourceId !== 'string')
        || typeof draft.savedAt !== 'string'
        || !Number.isFinite(Date.parse(draft.savedAt))) return []

      return [[key, { note, sourceId, savedAt: draft.savedAt } satisfies NoteDraft]]
    }))
  }
  catch {
    return {}
  }
}

export const useDraftsStore = defineStore('drafts', () => {
  const drafts = ref<Record<string, NoteDraft>>({})
  const hydrated = ref(false)
  const storageAvailable = ref(true)

  function hydrate(): void {
    if (hydrated.value) return
    const stored = readLocalStorage(DRAFTS_STORAGE_KEY)
    storageAvailable.value = stored.ok
    drafts.value = parseDrafts(stored.value)
    hydrated.value = true
  }

  function persist(): boolean {
    const payload: PersistedDrafts = { version: STORAGE_SCHEMA_VERSION, drafts: drafts.value }
    storageAvailable.value = writeLocalStorage(DRAFTS_STORAGE_KEY, JSON.stringify(payload))
    return storageAvailable.value
  }

  function get(key: string): NoteDraft | undefined {
    return drafts.value[key]
  }

  function save(key: string, draft: NoteDraft): boolean {
    const previous = drafts.value[key]
    drafts.value[key] = { ...draft, note: cloneNote(draft.note) }
    if (persist()) return true
    if (previous) drafts.value[key] = previous
    else delete drafts.value[key]
    return false
  }

  function remove(key: string): boolean {
    if (!(key in drafts.value)) return true
    const previous = drafts.value[key]
    delete drafts.value[key]
    if (persist()) return true
    if (previous) drafts.value[key] = previous
    return false
  }

  return { drafts, hydrated, storageAvailable, hydrate, get, save, remove }
})
