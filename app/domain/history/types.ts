import type { Note, TodoItem } from '~/types/note'

export type NoteChange =
  | { type: 'set-title'; before: string; after: string }
  | { type: 'set-todo-text'; todoId: string; before: string; after: string }
  | { type: 'set-todo-completed'; todoId: string; before: boolean; after: boolean }
  | { type: 'add-todo'; todo: TodoItem; index: number }
  | { type: 'remove-todo'; todo: TodoItem; index: number }

export interface HistoryState {
  past: NoteChange[]
  future: NoteChange[]
}

export const applyChange = (note: Note, change: NoteChange): void => {
  switch (change.type) {
    case 'set-title':
      note.title = change.after
      return
    case 'set-todo-text': {
      const todo = note.todos.find(item => item.id === change.todoId)
      if (todo) todo.text = change.after
      return
    }
    case 'set-todo-completed': {
      const todo = note.todos.find(item => item.id === change.todoId)
      if (todo) todo.completed = change.after
      return
    }
    case 'add-todo':
      note.todos.splice(change.index, 0, structuredClone(change.todo))
      return
    case 'remove-todo': {
      const index = note.todos.findIndex(item => item.id === change.todo.id)
      if (index !== -1) note.todos.splice(index, 1)
    }
  }
}

export const invertChange = (change: NoteChange): NoteChange => {
  switch (change.type) {
    case 'set-title':
      return { ...change, before: change.after, after: change.before }
    case 'set-todo-text':
      return { ...change, before: change.after, after: change.before }
    case 'set-todo-completed':
      return { ...change, before: change.after, after: change.before }
    case 'add-todo':
      return { type: 'remove-todo', todo: structuredClone(change.todo), index: change.index }
    case 'remove-todo':
      return { type: 'add-todo', todo: structuredClone(change.todo), index: change.index }
  }
}
