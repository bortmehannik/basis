import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { NOTES_STORAGE_KEY, parseNotes, useNotesStore } from '../app/stores/notes'
import type { Note } from '../app/types/note'

const note: Note = {
  id: 'one',
  title: 'Тест',
  todos: [{ id: 'todo', text: 'Проверить', completed: false, priority: 'medium' }],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('notes store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('сохраняет данные с версией схемы только при явном сохранении', () => {
    const store = useNotesStore()
    store.hydrate()
    expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBeNull()

    store.save(note)
    const raw = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)!)
    expect(raw.version).toBe(2)
    expect(raw.notes).toEqual([note])
  })

  it('восстанавливает заметки после перезагрузки стора', () => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify({ version: 2, notes: [note] }))
    const store = useNotesStore()
    store.hydrate()
    expect(store.findById('one')).toEqual(note)
  })

  it('безопасно обрабатывает повреждённые и неизвестные данные', () => {
    expect(parseNotes('{broken')).toEqual([])
    expect(parseNotes(JSON.stringify({ version: 3, notes: [note] }))).toEqual([])
    expect(parseNotes(JSON.stringify({ version: 1, notes: [{ id: 10 }] }))).toEqual([])
    expect(parseNotes(JSON.stringify({ version: 2, notes: [{ ...note, updatedAt: 'invalid' }] }))).toEqual([])
  })

  it('устраняет дубликаты идентификаторов при чтении', () => {
    const newer = { ...note, title: 'Последняя версия' }
    const parsed = parseNotes(JSON.stringify({ version: 2, notes: [note, newer] }))

    expect(parsed).toEqual([newer])
  })

  it('мигрирует задачи первой версии без приоритета', () => {
    const legacy = { ...note, todos: [{ id: 'legacy', text: 'Старая задача', completed: false }] }
    const parsed = parseNotes(JSON.stringify({ version: 1, notes: [legacy] }))
    expect(parsed[0]?.todos[0]?.priority).toBe('none')
  })

  it('удаляет заметку и синхронно обновляет хранилище', () => {
    const store = useNotesStore()
    store.save(note)
    expect(store.remove('one')).toBe(true)
    expect(JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)!).notes).toEqual([])
    expect(store.remove('missing')).toBe(false)
  })

  it('откатывает изменение стора при ошибке записи', () => {
    const store = useNotesStore()
    store.save(note)
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })

    expect(store.save({ ...note, title: 'Не сохранится' })).toBe(false)
    expect(store.findById('one')?.title).toBe('Тест')
    expect(store.storageAvailable).toBe(false)
  })
})
