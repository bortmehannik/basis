import { defineStore } from 'pinia'
import { computed, markRaw, ref, toRaw } from 'vue'
import { NoteHistory } from '~/domain/history/note-history'
import { applyChange, type NoteChange } from '~/domain/history/types'
import type { Note } from '~/types/note'
import { createId } from '~/utils/id'
import { cloneNote } from '~/utils/note'

interface PendingTextChange {
  before: string
  timer: ReturnType<typeof setTimeout>
}

const TEXT_COMMIT_DELAY = 700

const getEditableContent = (source: Note | null): string => JSON.stringify({
  title: source?.title ?? '',
  todos: source?.todos.map(todo => ({ id: todo.id, text: todo.text })) ?? [],
})

export const useEditorStore = defineStore('editor', () => {
  const note = ref<Note | null>(null)
  const original = ref<Note | null>(null)
  const history = markRaw(new NoteHistory(50))
  const pending = markRaw(new Map<string, PendingTextChange>())
  const revision = ref(0)

  const canUndo = computed(() => {
    revision.value
    return history.canUndo || pending.size > 0
  })
  const canRedo = computed(() => {
    revision.value
    return history.canRedo
  })
  const isDirty = computed(() => getEditableContent(note.value) !== getEditableContent(original.value))

  function clearPending(): void {
    for (const item of pending.values()) clearTimeout(item.timer)
    pending.clear()
  }

  function start(source: Note): void {
    clearPending()
    history.clear()
    note.value = cloneNote(source)
    original.value = cloneNote(source)
    revision.value++
  }

  function reset(): void {
    clearPending()
    history.clear()
    note.value = null
    original.value = null
    revision.value++
  }

  function restoreWorkingCopy(source: Note): void {
    clearPending()
    history.clear()
    note.value = cloneNote(source)
    revision.value++
  }

  function record(change: NoteChange): void {
    history.record(change)
    revision.value++
  }

  function finalizeText(key: string): void {
    const activeNote = note.value
    const item = pending.get(key)
    if (!activeNote || !item) return

    clearTimeout(item.timer)
    pending.delete(key)

    if (key === 'title') {
      if (item.before !== activeNote.title) {
        record({ type: 'set-title', before: item.before, after: activeNote.title })
      }
      return
    }

    const todoId = key.slice(5)
    const todo = activeNote.todos.find(candidate => candidate.id === todoId)
    if (todo && item.before !== todo.text) {
      record({ type: 'set-todo-text', todoId, before: item.before, after: todo.text })
    }
  }

  function finalizeAllText(): void {
    for (const key of [...pending.keys()]) finalizeText(key)
  }

  function scheduleText(key: string, before: string): void {
    const current = pending.get(key)
    if (current) clearTimeout(current.timer)
    else history.discardFuture()

    const baseline = current?.before ?? before
    const timer = setTimeout(() => finalizeText(key), TEXT_COMMIT_DELAY)
    pending.set(key, { before: baseline, timer })
    revision.value++
  }

  function updateTitle(value: string): void {
    if (!note.value || value === note.value.title) return
    const before = note.value.title
    note.value.title = value
    scheduleText('title', before)
  }

  function updateTodoText(todoId: string, value: string): void {
    const todo = note.value?.todos.find(item => item.id === todoId)
    if (!todo || value === todo.text) return
    const before = todo.text
    todo.text = value
    scheduleText(`todo:${todoId}`, before)
  }

  function commitAtomic(change: NoteChange): void {
    if (!note.value) return
    finalizeAllText()
    applyChange(note.value, change)
    record(change)
  }

  function toggleTodo(todoId: string): void {
    const todo = note.value?.todos.find(item => item.id === todoId)
    if (!todo) return
    commitAtomic({ type: 'set-todo-completed', todoId, before: todo.completed, after: !todo.completed })
  }

  function addTodo(text = ''): string | null {
    if (!note.value) return null
    const todo = { id: createId(), text, completed: false }
    commitAtomic({ type: 'add-todo', todo, index: note.value.todos.length })
    return todo.id
  }

  function removeTodo(todoId: string): void {
    const index = note.value?.todos.findIndex(item => item.id === todoId) ?? -1
    if (!note.value || index === -1) return
    const todo = note.value.todos[index]
    if (!todo) return
    commitAtomic({ type: 'remove-todo', todo: structuredClone(toRaw(todo)), index })
  }

  function undo(): void {
    if (!note.value) return
    finalizeAllText()
    if (history.undo(note.value)) revision.value++
  }

  function redo(): void {
    if (!note.value) return
    finalizeAllText()
    if (history.redo(note.value)) revision.value++
  }

  function markSaved(saved: Note): void {
    clearPending()
    history.clear()
    note.value = cloneNote(saved)
    original.value = cloneNote(saved)
    revision.value++
  }

  return {
    note,
    original,
    canUndo,
    canRedo,
    isDirty,
    start,
    reset,
    restoreWorkingCopy,
    updateTitle,
    updateTodoText,
    finalizeText,
    finalizeAllText,
    toggleTodo,
    addTodo,
    removeTodo,
    undo,
    redo,
    markSaved,
  }
})
