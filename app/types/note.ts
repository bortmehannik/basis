export type TodoPriority = 'high' | 'medium' | 'low' | 'none'
export const STORAGE_SCHEMA_VERSION = 2 as const

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  priority: TodoPriority
}

export interface Note {
  id: string
  title: string
  todos: TodoItem[]
  createdAt: string
  updatedAt: string
}

export interface PersistedNotes {
  version: typeof STORAGE_SCHEMA_VERSION
  notes: Note[]
}

export interface NoteDraft {
  note: Note
  sourceId: string | null
  savedAt: string
}

export interface PersistedDrafts {
  version: typeof STORAGE_SCHEMA_VERSION
  drafts: Record<string, NoteDraft>
}
