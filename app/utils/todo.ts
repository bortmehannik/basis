import type { TodoItem, TodoPriority } from '~/types/note'

export const TODO_PRIORITY_ORDER: Record<TodoPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
}

export const sortTodosByPriority = (todos: TodoItem[]): TodoItem[] =>
  [...todos].sort((left, right) => TODO_PRIORITY_ORDER[left.priority] - TODO_PRIORITY_ORDER[right.priority])
