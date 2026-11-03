import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { NoteHistory } from '../app/domain/history/note-history'
import { applyChange } from '../app/domain/history/types'
import { useEditorStore } from '../app/stores/editor'
import type { Note } from '../app/types/note'

const makeNote = (): Note => ({
  id: 'note-1',
  title: 'Исходный заголовок',
  todos: [{ id: 'todo-1', text: 'Первая задача', completed: false, priority: 'none' }],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('NoteHistory', () => {
  it('отменяет и повторяет атомарные операции', () => {
    const note = makeNote()
    const history = new NoteHistory()
    const change = { type: 'set-todo-completed', todoId: 'todo-1', before: false, after: true } as const

    applyChange(note, change)
    history.record(change)
    expect(note.todos[0]?.completed).toBe(true)

    expect(history.undo(note)).toBe(true)
    expect(note.todos[0]?.completed).toBe(false)
    expect(history.redo(note)).toBe(true)
    expect(note.todos[0]?.completed).toBe(true)
  })

  it('очищает redo-ветку после нового изменения', () => {
    const note = makeNote()
    const history = new NoteHistory()
    const first = { type: 'set-title', before: note.title, after: 'Первое' } as const
    applyChange(note, first)
    history.record(first)
    history.undo(note)

    const second = { type: 'set-title', before: note.title, after: 'Новое' } as const
    applyChange(note, second)
    history.record(second)

    expect(history.canRedo).toBe(false)
    expect(history.redo(note)).toBe(false)
  })

  it('хранит не больше 50 операций', () => {
    const history = new NoteHistory(50)
    for (let index = 0; index < 65; index++) {
      history.record({ type: 'set-title', before: String(index), after: String(index + 1) })
    }
    expect(history.size).toBe(50)
  })

  it('корректно восстанавливает удалённую задачу на прежней позиции', () => {
    const note = makeNote()
    note.todos.push({ id: 'todo-2', text: 'Вторая задача', completed: false, priority: 'high' })
    const history = new NoteHistory()
    const removed = structuredClone(note.todos[0]!)
    const change = { type: 'remove-todo', todo: removed, index: 0 } as const
    applyChange(note, change)
    history.record(change)

    history.undo(note)
    expect(note.todos.map(todo => todo.id)).toEqual(['todo-1', 'todo-2'])
  })

  it('отменяет изменение приоритета как отдельную операцию', () => {
    const note = makeNote()
    const history = new NoteHistory()
    const change = { type: 'set-todo-priority', todoId: 'todo-1', before: 'none', after: 'high' } as const
    applyChange(note, change)
    history.record(change)

    expect(note.todos[0]?.priority).toBe('high')
    history.undo(note)
    expect(note.todos[0]?.priority).toBe('none')
  })
})

describe('editor text history semantics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  it('объединяет непрерывный ввод в одну запись после паузы', () => {
    const editor = useEditorStore()
    editor.start(makeNote())
    editor.updateTitle('Н')
    editor.updateTitle('Но')
    editor.updateTitle('Новый заголовок')

    vi.advanceTimersByTime(700)
    editor.undo()
    expect(editor.note?.title).toBe('Исходный заголовок')
    expect(editor.canUndo).toBe(false)
  })

  it('фиксирует blur и сбрасывает историю после сохранения', () => {
    const editor = useEditorStore()
    editor.start(makeNote())
    editor.updateTodoText('todo-1', 'Изменённая задача')
    editor.finalizeText('todo:todo-1')
    expect(editor.canUndo).toBe(true)

    editor.markSaved(editor.note!)
    expect(editor.canUndo).toBe(false)
    expect(editor.canRedo).toBe(false)
  })

  it('создаёт введённую задачу одной атомарной операцией', () => {
    const editor = useEditorStore()
    editor.start(makeNote())
    const todoId = editor.addTodo('Новая задача')

    expect(editor.note?.todos.find(todo => todo.id === todoId)?.text).toBe('Новая задача')
    editor.undo()
    expect(editor.note?.todos.some(todo => todo.id === todoId)).toBe(false)
  })

  it('хранит чекбокс, добавление и удаление как независимые операции', () => {
    const editor = useEditorStore()
    editor.start(makeNote())

    editor.toggleTodo('todo-1')
    const addedId = editor.addTodo('Вторая задача')!
    editor.removeTodo('todo-1')

    editor.undo()
    expect(editor.note?.todos.map(todo => todo.id)).toEqual(['todo-1', addedId])
    editor.undo()
    expect(editor.note?.todos.map(todo => todo.id)).toEqual(['todo-1'])
    editor.undo()
    expect(editor.note?.todos[0]?.completed).toBe(false)
  })

  it('очищает redo сразу после начала нового текстового изменения', () => {
    const editor = useEditorStore()
    editor.start(makeNote())
    editor.toggleTodo('todo-1')
    editor.undo()
    expect(editor.canRedo).toBe(true)

    editor.updateTitle('Новый заголовок')
    expect(editor.canRedo).toBe(false)
  })

  it('восстанавливает черновик как несохранённую рабочую копию', () => {
    const editor = useEditorStore()
    const saved = makeNote()
    const draft = { ...makeNote(), title: 'Черновик' }
    editor.start(saved)
    editor.toggleTodo('todo-1')

    editor.restoreWorkingCopy(draft)

    expect(editor.note?.title).toBe('Черновик')
    expect(editor.original?.title).toBe('Исходный заголовок')
    expect(editor.isDirty).toBe(true)
    expect(editor.canUndo).toBe(false)
    expect(editor.canRedo).toBe(false)
  })
})
