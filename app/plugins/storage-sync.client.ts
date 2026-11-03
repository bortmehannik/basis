import { useDraftsStore } from '~/stores/drafts'
import { NOTES_STORAGE_KEY, useNotesStore } from '~/stores/notes'

export default defineNuxtPlugin(() => {
  const notes = useNotesStore()
  const drafts = useDraftsStore()
  notes.hydrate()
  drafts.hydrate()

  const onStorage = (event: StorageEvent): void => {
    if (event.key === NOTES_STORAGE_KEY) notes.replaceFromStorage(event.newValue)
  }

  window.addEventListener('storage', onStorage)
  import.meta.hot?.dispose(() => window.removeEventListener('storage', onStorage))
})
