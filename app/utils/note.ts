import { toRaw } from 'vue'
import type { Note } from '~/types/note'
import { createId } from './id'

export const cloneNote = (note: Note): Note => structuredClone(toRaw(note))

export const createEmptyNote = (): Note => {
  const now = new Date().toISOString()

  return {
    id: createId(),
    title: '',
    todos: [],
    createdAt: now,
    updatedAt: now,
  }
}
