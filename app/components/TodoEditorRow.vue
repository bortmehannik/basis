<script setup lang="ts">
import type { TodoItem, TodoPriority } from '~/types/note'

const props = defineProps<{ todo: TodoItem }>()
const emit = defineEmits<{
  toggle: []
  update: [value: string]
  blur: []
  enter: []
  priority: [value: TodoPriority]
  remove: []
}>()

const input = ref<HTMLInputElement | null>(null)
defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="todo-row" :class="[`priority-${todo.priority}`, { 'todo-row--complete': todo.completed }]">
    <button
      type="button"
      class="todo-checkbox"
      :aria-label="todo.completed ? 'Отметить как невыполненное' : 'Отметить как выполненное'"
      :aria-pressed="todo.completed"
      @click="emit('toggle')"
    >
      <AppIcon v-if="todo.completed" name="check" :size="15" />
    </button>
    <input
      ref="input"
      class="todo-row__input"
      :value="props.todo.text"
      aria-label="Текст задачи"
      placeholder="Новая задача"
      @input="emit('update', ($event.target as HTMLInputElement).value)"
      @blur="emit('blur')"
      @keydown.enter.prevent="emit('enter')"
    >
    <div class="priority-control" :class="`priority-control--${todo.priority}`">
      <select
        class="priority-select"
        :class="`priority-select--${todo.priority}`"
        :value="todo.priority"
        aria-label="Приоритет задачи"
        @change="emit('priority', ($event.target as HTMLSelectElement).value as TodoPriority)"
      >
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
        <option value="none">Без приоритета</option>
      </select>
      <AppIcon class="priority-control__icon" name="chevron-down" :size="16" />
    </div>
    <button type="button" class="todo-row__remove" aria-label="Удалить задачу" @click="emit('remove')">
      <AppIcon name="trash" :size="18" />
    </button>
  </div>
</template>
