import { describe, expect, it } from 'vitest'
import { sortTodosByPriority } from '../app/utils/todo'
import type { TodoItem } from '../app/types/note'

describe('todo priority sorting', () => {
  it('сортирует по High, Medium, Low и без приоритета', () => {
    const todos: TodoItem[] = [
      { id: 'none', text: 'Без приоритета', completed: false, priority: 'none' },
      { id: 'low', text: 'Низкий', completed: false, priority: 'low' },
      { id: 'high', text: 'Высокий', completed: false, priority: 'high' },
      { id: 'medium', text: 'Средний', completed: false, priority: 'medium' },
    ]

    expect(sortTodosByPriority(todos).map(todo => todo.id)).toEqual(['high', 'medium', 'low', 'none'])
    expect(todos.map(todo => todo.id)).toEqual(['none', 'low', 'high', 'medium'])
  })

  it('сохраняет исходный порядок задач одинакового приоритета', () => {
    const todos: TodoItem[] = [
      { id: 'first', text: 'Первая', completed: false, priority: 'high' },
      { id: 'second', text: 'Вторая', completed: true, priority: 'high' },
    ]

    expect(sortTodosByPriority(todos).map(todo => todo.id)).toEqual(['first', 'second'])
  })
})
