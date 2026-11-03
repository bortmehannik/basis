import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { DRAFTS_STORAGE_KEY, parseDrafts, useDraftsStore } from '../app/stores/drafts'
import type { Note, NoteDraft } from '../app/types/note'

const note: Note = {
  id: 'draft-note',
  title: 'Черновик',
  todos: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const draft: NoteDraft = {
  note,
  sourceId: 'draft-note',
  savedAt: '2026-01-02T00:00:00.000Z',
}

describe('drafts store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('сохраняет версионированный черновик и восстанавливает его', () => {
    const store = useDraftsStore()
    store.hydrate()
    store.save('draft-note', draft)

    const raw = JSON.parse(localStorage.getItem(DRAFTS_STORAGE_KEY)!)
    expect(raw.version).toBe(2)
    expect(raw.drafts['draft-note']).toEqual(draft)
    expect(parseDrafts(JSON.stringify(raw))).toEqual({ 'draft-note': draft })
  })

  it('возвращает безопасное пустое состояние для повреждённых данных', () => {
    expect(parseDrafts('{broken')).toEqual({})
    expect(parseDrafts(JSON.stringify({ version: 3, drafts: { note: draft } }))).toEqual({})
  })

  it('отбрасывает черновики с некорректной датой или sourceId', () => {
    const invalidDate = { ...draft, savedAt: 'not-a-date' }
    const invalidSource = { ...draft, sourceId: 42 }
    const raw = JSON.stringify({ version: 2, drafts: { invalidDate, invalidSource } })

    expect(parseDrafts(raw)).toEqual({})
  })

  it('удаляет черновик одновременно из стора и localStorage', () => {
    const store = useDraftsStore()
    store.save('draft-note', draft)
    store.remove('draft-note')

    expect(store.get('draft-note')).toBeUndefined()
    expect(JSON.parse(localStorage.getItem(DRAFTS_STORAGE_KEY)!).drafts).toEqual({})
  })
})
