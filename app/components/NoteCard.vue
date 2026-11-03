<script setup lang="ts">
import type { Note } from '~/types/note'
import { formatNoteDate } from '~/utils/date'
import { sortTodosByPriority } from '~/utils/todo'

const props = defineProps<{ note: Note }>()
const emit = defineEmits<{ delete: [note: Note] }>()

const sortedTodos = computed(() => sortTodosByPriority(props.note.todos))

function openCard(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (target.closest('button, a, input, select, textarea')) return
  navigateTo(`/notes/${props.note.id}`)
}
</script>

<template>
  <article class="note-card" @click="openCard">
    <div class="note-card__body">
      <div class="note-card__heading">
        <NuxtLink
          :to="`/notes/${note.id}`"
          class="note-card__title-link"
          :aria-label="`Редактировать заметку «${note.title}»`"
        >
          <h2>{{ note.title }}</h2>
        </NuxtLink>
        <span class="note-card__count">{{ note.todos.length }}</span>
      </div>
      <ul v-if="note.todos.length" class="todo-preview" aria-label="Первые задачи">
        <li
          v-for="todo in sortedTodos.slice(0, 3)"
          :key="todo.id"
          :class="[`priority-${todo.priority}`, { 'is-complete': todo.completed }]"
        >
          <span class="todo-preview__check" aria-hidden="true">
            <AppIcon v-if="todo.completed" name="check" :size="12" />
          </span>
          <span class="todo-preview__label">
            {{ todo.text }}
          </span>
        </li>
      </ul>
      <p v-else class="note-card__empty">Нет задач</p>
      <p v-if="note.todos.length > 3" class="note-card__more">Ещё {{ note.todos.length - 3 }}</p>
    </div>
    <div class="note-card__footer">
      <time :datetime="note.updatedAt">
        {{ formatNoteDate(note.updatedAt) }}
      </time>
      <div class="note-card__actions">
        <NuxtLink :to="`/notes/${note.id}`" class="icon-link" aria-label="Редактировать заметку">
          <AppIcon name="edit" :size="18" />
        </NuxtLink>
        <button class="icon-link icon-link--danger" type="button" aria-label="Удалить заметку" @click="emit('delete', note)">
          <AppIcon name="trash" :size="18" />
        </button>
      </div>
    </div>
  </article>
</template>
