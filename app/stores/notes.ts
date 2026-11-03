import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { STORAGE_SCHEMA_VERSION, type Note, type PersistedNotes, type TodoItem, type TodoPriority } from '~/types/note'
import { cloneNote } from '~/utils/note'
import { readLocalStorage, writeLocalStorage } from '~/utils/storage'

export const NOTES_STORAGE_KEY = 'notes-app:data'
const priorities = new Set<TodoPriority>(['high', 'medium', 'low', 'none'])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isValidDate = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value))

const isTodoPriority = (value: unknown): value is TodoPriority =>
  typeof value === 'string' && priorities.has(value as TodoPriority)

export const normalizeNote = (value: unknown): Note | null => {
  if (!isRecord(value)) return null

  if (typeof value.id !== 'string'
    || value.id.length === 0
    || typeof value.title !== 'string'
    || !isValidDate(value.createdAt)
    || !isValidDate(value.updatedAt)
    || !Array.isArray(value.todos)) return null

  const todos: TodoItem[] = []
  const todoIds = new Set<string>()
  for (const todo of value.todos) {
    if (!isRecord(todo)
      || typeof todo.id !== 'string'
      || todo.id.length === 0
      || todoIds.has(todo.id)
      || typeof todo.text !== 'string'
      || typeof todo.completed !== 'boolean') return null

    todoIds.add(todo.id)
    todos.push({
      id: todo.id,
      text: todo.text,
      completed: todo.completed,
      priority: isTodoPriority(todo.priority) ? todo.priority : 'none',
    })
  }

  return {
    id: value.id,
    title: value.title,
    todos,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

export const parseNotes = (raw: string | null): Note[] => {
  if (!raw) return []

  try {
    const data = JSON.parse(raw) as { version?: unknown; notes?: unknown }
    if ((data.version !== 1 && data.version !== STORAGE_SCHEMA_VERSION) || !Array.isArray(data.notes)) return []
    const notes = data.notes.map(normalizeNote).filter((note): note is Note => note !== null)
    return [...new Map(notes.map(note => [note.id, note])).values()]
  }
  catch {
    return []
  }
}

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const hydrated = ref(false)
  const storageAvailable = ref(true)

  const sortedNotes = computed(() => [...notes.value].sort((a, b) =>
    Date.parse(b.updatedAt) - Date.parse(a.updatedAt)))

  function hydrate(): void {
    if (hydrated.value) return
    const stored = readLocalStorage(NOTES_STORAGE_KEY)
    storageAvailable.value = stored.ok
    notes.value = parseNotes(stored.value)
    hydrated.value = true
  }

  function persist(): boolean {
    const data: PersistedNotes = { version: STORAGE_SCHEMA_VERSION, notes: notes.value }
    storageAvailable.value = writeLocalStorage(NOTES_STORAGE_KEY, JSON.stringify(data))
    return storageAvailable.value
  }

  function replaceFromStorage(raw: string | null): void {
    notes.value = parseNotes(raw)
    storageAvailable.value = true
    hydrated.value = true
  }

  function findById(id: string): Note | undefined {
    return notes.value.find(note => note.id === id)
  }

  function save(note: Note): boolean {
    const copy = cloneNote(note)
    const index = notes.value.findIndex(item => item.id === copy.id)
    const previous = index === -1 ? null : notes.value[index]
    if (index === -1) notes.value.push(copy)
    else notes.value[index] = copy
    if (persist()) return true

    if (index === -1) notes.value.pop()
    else if (previous) notes.value[index] = previous
    return false
  }

  function remove(id: string): boolean {
    const index = notes.value.findIndex(note => note.id === id)
    if (index === -1) return false
    const [removed] = notes.value.splice(index, 1)
    if (persist()) return true
    if (removed) notes.value.splice(index, 0, removed)
    return false
  }

  return { notes, sortedNotes, hydrated, storageAvailable, hydrate, replaceFromStorage, findById, save, remove }
})
