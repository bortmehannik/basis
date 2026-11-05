<script setup lang="ts">
import type { TodoItem } from '~/types/note'

const props = defineProps<{ todo: TodoItem }>()
const emit = defineEmits<{
  toggle: []
  update: [value: string]
  blur: []
  enter: []
  remove: []
}>()

const input = ref<HTMLInputElement | null>(null)
defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="todo-row" :class="{ 'todo-row--complete': todo.completed }">
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
    <button type="button" class="todo-row__remove" aria-label="Удалить задачу" @click="emit('remove')">
      <AppIcon name="trash" :size="18" />
    </button>
  </div>
</template>
